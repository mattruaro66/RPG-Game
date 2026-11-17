import { CANONICAL, rules } from '../config/rules';
import { simpleTest, type SimpleTestResult } from './checks';
import type { CharacterState, Dice } from './types';

export type SanityState = 'sao' | 'paranoia' | 'comprometimento' | 'beira_colapso' | 'loucura';

export const SANITY_LABELS: Record<SanityState, string> = {
  sao: 'São',
  paranoia: 'Paranoia',
  comprometimento: 'Comprometimento psicológico',
  beira_colapso: 'À beira do colapso',
  loucura: 'Loucura irreversível',
};

export function sanityState(value: number): SanityState {
  if (value >= 8) return 'sao';
  if (value >= 5) return 'paranoia';
  if (value >= 2) return 'comprometimento';
  if (value === 1) return 'beira_colapso';
  return 'loucura';
}

export function isPsychiatristProtected(c: CharacterState): boolean {
  return c.profession === 'medico' && c.specialties.includes('psiquiatria');
}

/** Personagem perde a condição de protagonista jogável com Sanidade 0 ou morte. */
export function isPlayable(c: CharacterState): boolean {
  return c.status !== 'morto' && c.sanity > 0;
}

/** Pode agir normalmente (vivo, PV > 0, Sanidade > 0). */
export function canAct(c: CharacterState): boolean {
  return isPlayable(c) && c.status === 'ativo';
}

export function needsFocusCheck(c: CharacterState): boolean {
  return rules.focusCheckOnTests && c.sanity >= 1 && c.sanity <= 4;
}

export interface SanityChange {
  character: CharacterState;
  before: number;
  after: number;
  prevented: number;
  note?: string;
}

export function loseSanity(c: CharacterState, amount: number): SanityChange {
  const before = c.sanity;
  if (before <= 0 || amount <= 0) return { character: c, before, after: before, prevented: 0 };
  let after = Math.max(0, before - amount);
  let note: string | undefined;
  let prevented = 0;
  if (isPsychiatristProtected(c) && after < CANONICAL.psychiatryFloor) {
    const floor = Math.min(before, CANONICAL.psychiatryFloor);
    prevented = floor - after;
    after = floor;
    if (prevented > 0) note = 'Psiquiatria: a Sanidade não cai abaixo de 5.';
  }
  if (after === 0) note = 'Loucura irreversível. O personagem deixa de ser jogável.';
  return { character: { ...c, sanity: after }, before, after, prevented, note };
}

// ---------------------------------------------------------------------------
// Tabela configurável de eventos de horror (seção 13.2)
// ---------------------------------------------------------------------------

export type HorrorEventId = 'evidencia_estranha' | 'horror_humano' | 'manifestacao_sobrenatural';

export const HORROR_EVENTS: Record<HorrorEventId, { label: string; mode: 'nenhuma' | 'teste_espirito' | 'automatica'; loss: number }> = {
  evidencia_estranha: { label: 'Evidência estranha sem exposição direta', mode: 'nenhuma', loss: 0 },
  horror_humano: { label: 'Horror humano', mode: 'teste_espirito', loss: 1 },
  manifestacao_sobrenatural: { label: 'Manifestação sobrenatural presenciada', mode: 'automatica', loss: 1 },
};

export interface HorrorResult {
  change: SanityChange;
  test?: SimpleTestResult;
}

export function applyHorrorEvent(dice: Dice, c: CharacterState, event: HorrorEventId): HorrorResult {
  const def = HORROR_EVENTS[event];
  if (def.mode === 'nenhuma' || c.sanity <= 0) return { change: { character: c, before: c.sanity, after: c.sanity, prevented: 0 } };
  if (def.mode === 'automatica') return { change: loseSanity(c, def.loss) };
  const test = simpleTest(dice, { label: `Espírito — ${def.label}`, attribute: 'espirito', value: c.attributes.espirito });
  if (test.success) return { change: { character: c, before: c.sanity, after: c.sanity, prevented: 0 }, test };
  return { change: loseSanity(c, def.loss), test };
}

// ---------------------------------------------------------------------------
// Recuperação diária (13.3) e Psiquiatria (13.4)
// ---------------------------------------------------------------------------

export function canRecoverToday(c: CharacterState, day: number): boolean {
  return c.sanity > 0 && c.sanity < CANONICAL.maxSanity && c.lastSanityRecoveryDay !== day;
}

export function dailySanityRecovery(dice: Dice, c: CharacterState, day: number): { character: CharacterState; test: SimpleTestResult | null; reason?: string } {
  if (c.sanity <= 0) return { character: c, test: null, reason: 'Sanidade 0 é irreversível.' };
  if (c.lastSanityRecoveryDay === day) return { character: c, test: null, reason: 'Já tentou recuperar hoje.' };
  if (c.sanity >= CANONICAL.maxSanity) return { character: c, test: null, reason: 'Sanidade já está no máximo.' };
  const test = simpleTest(dice, { label: 'Espírito — recuperação diária de Sanidade', attribute: 'espirito', value: c.attributes.espirito });
  const sanity = test.success ? Math.min(CANONICAL.maxSanity, c.sanity + 1) : c.sanity;
  return { character: { ...c, sanity, lastSanityRecoveryDay: day }, test };
}

export function canProvidePsychiatricHelp(doctor: CharacterState, day: number): { ok: boolean; reason?: string } {
  if (!doctor.specialties.includes('psiquiatria')) return { ok: false, reason: 'Exige a especialidade Psiquiatria.' };
  if (doctor.status !== 'ativo' || doctor.sanity <= 0) return { ok: false, reason: 'O médico não está em condições.' };
  if (doctor.sanity < CANONICAL.psychiatryHelpMinSanity) return { ok: false, reason: 'Com Sanidade 7 ou menos, perde temporariamente a capacidade de ajudar.' };
  if (doctor.lastPsychiatryGivenDay === day) return { ok: false, reason: 'Já ajudou alguém hoje.' };
  return { ok: true };
}

export function psychiatricHelp(doctor: CharacterState, target: CharacterState, day: number): { doctor: CharacterState; target: CharacterState; ok: boolean; reason?: string } {
  const can = canProvidePsychiatricHelp(doctor, day);
  if (!can.ok) return { doctor, target, ok: false, reason: can.reason };
  if (doctor.id === target.id) return { doctor, target, ok: false, reason: 'Ajuda psiquiátrica é para outro personagem.' };
  if (target.sanity <= 0) return { doctor, target, ok: false, reason: 'Sanidade 0 é irreversível.' };
  if (target.sanity >= CANONICAL.maxSanity) return { doctor, target, ok: false, reason: 'Sanidade já está no máximo.' };
  return {
    doctor: { ...doctor, lastPsychiatryGivenDay: day },
    target: { ...target, sanity: target.sanity + 1 },
    ok: true,
  };
}
