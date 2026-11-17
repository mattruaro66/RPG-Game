import { CANONICAL, rules } from '../config/rules';
import { resolveBonuses, type BonusResolution, type ModifierKind } from './bonuses';
import { ATTRIBUTE_LABELS, type AttributeId, type ContextTag, type Dice } from './types';

// ---------------------------------------------------------------------------
// Teste simples — D6 (seção 7.1)
// ---------------------------------------------------------------------------

export interface SimpleTestInput {
  label: string;
  attribute: AttributeId;
  value: number;
  /** Somente para traços canônicos de inimigos (+1). */
  traitModifier?: number;
}

export interface SimpleTestResult {
  kind: 'd6';
  label: string;
  attribute: AttributeId;
  value: number;
  effective: number;
  roll: number | null;
  success: boolean;
  autoFail: boolean;
  impossible: boolean;
  notes: string[];
}

export function simpleTest(dice: Dice, input: SimpleTestInput): SimpleTestResult {
  const mod = input.traitModifier ?? 0;
  const effective = input.value + mod;
  const notes: string[] = [];
  if (mod) notes.push(`Traço de inimigo: +${mod}`);
  if (input.value <= 0) {
    notes.push(`${ATTRIBUTE_LABELS[input.attribute]} 0: ação impossível.`);
    return { kind: 'd6', label: input.label, attribute: input.attribute, value: input.value, effective, roll: null, success: false, autoFail: false, impossible: true, notes };
  }
  const roll = dice.d6();
  const autoFail = roll === 6;
  if (autoFail) notes.push('6 natural: falha automática.');
  return {
    kind: 'd6', label: input.label, attribute: input.attribute, value: input.value, effective,
    roll, success: !autoFail && roll <= effective, autoFail, impossible: false, notes,
  };
}

// ---------------------------------------------------------------------------
// Teste de ação — D20 (seção 7.2)
// ---------------------------------------------------------------------------

export interface LimitBreakdown {
  attribute: AttributeId;
  attributeValue: number;
  specialtyId?: string;
  hasSpecialty: boolean;
  kind: ModifierKind;
  base: number;
  traitModifier: number;
  limit: number;
  appliedBonus?: { id: string; name: string };
  appliedOnus?: { id: string; name: string };
  notes: string[];
}

export interface LimitInput {
  attribute: AttributeId;
  attributeValue: number;
  specialtyId?: string;
  hasSpecialty: boolean;
  bonusIds: string[];
  tags: ContextTag[];
  traitModifier?: number;
}

export function computeLimit(input: LimitInput): LimitBreakdown {
  const res: BonusResolution = resolveBonuses(input.bonusIds, input.tags, input.hasSpecialty);
  const trait = input.traitModifier ?? 0;
  let base = 0;
  if (input.hasSpecialty) {
    base = res.kind === 'bonus' ? CANONICAL.bonusBase : res.kind === 'onus' ? CANONICAL.onusBase : CANONICAL.specialtyBase;
  }
  const notes = [...res.notes];
  if (trait) notes.push(`Traço de inimigo: +${trait}`);
  const limit = Math.min(20, input.attributeValue + base + trait);
  return {
    attribute: input.attribute,
    attributeValue: input.attributeValue,
    specialtyId: input.specialtyId,
    hasSpecialty: input.hasSpecialty,
    kind: input.hasSpecialty ? res.kind : 'nenhum',
    base,
    traitModifier: trait,
    limit,
    appliedBonus: res.kind === 'bonus' && res.bonus ? { id: res.bonus.id, name: res.bonus.name } : undefined,
    appliedOnus: res.kind === 'onus' && res.onus ? { id: res.onus.id, name: res.onus.name } : undefined,
    notes,
  };
}

export interface ActionTestResult {
  kind: 'd20';
  label: string;
  breakdown: LimitBreakdown;
  rolls: number[];
  roll: number | null;
  success: boolean;
  critical: boolean;
  autoFail: boolean;
  impossible: boolean;
  rerolled: boolean;
  notes: string[];
}

function evaluateD20(roll: number, b: LimitBreakdown): Pick<ActionTestResult, 'success' | 'critical' | 'autoFail'> & { note?: string } {
  if (roll === 1) return { success: false, critical: false, autoFail: true, note: '1 natural: falha automática.' };
  const success = roll <= b.limit;
  // Crítico: resultado exatamente igual ao limite, exigindo a especialidade.
  const critical = success && b.hasSpecialty && roll === b.limit;
  let note: string | undefined;
  if (critical) note = 'Acerto crítico: resultado igual ao limite máximo.';
  else if (success && !b.hasSpecialty && roll === b.limit) note = 'Resultado igual ao limite, mas sem a especialidade não há crítico.';
  return { success, critical, autoFail: false, note };
}

export function actionTest(dice: Dice, label: string, breakdown: LimitBreakdown): ActionTestResult {
  const notes = [...breakdown.notes];
  if (breakdown.attributeValue <= 0) {
    notes.push(`${ATTRIBUTE_LABELS[breakdown.attribute]} 0: ação impossível.`);
    return { kind: 'd20', label, breakdown, rolls: [], roll: null, success: false, critical: false, autoFail: false, impossible: true, rerolled: false, notes };
  }
  const roll = dice.d20();
  const ev = evaluateD20(roll, breakdown);
  if (ev.note) notes.push(ev.note);
  return { kind: 'd20', label, breakdown, rolls: [roll], roll, success: ev.success, critical: ev.critical, autoFail: ev.autoFail, impossible: false, rerolled: false, notes };
}

/** Teimosia Inabalável: uma repetição por teste; o segundo resultado é obrigatório. */
export function canReroll(result: ActionTestResult, bonusIds: string[]): boolean {
  if (!bonusIds.includes('teimosia_inabalavel')) return false;
  if (result.rerolled || result.impossible) return false;
  if (rules.teimosiaOnlyOnFailure && result.success) return false;
  return true;
}

export function rerollActionTest(dice: Dice, prev: ActionTestResult): ActionTestResult {
  if (prev.rerolled) throw new Error('Teimosia Inabalável: apenas uma repetição por teste.');
  const roll = dice.d20();
  const ev = evaluateD20(roll, prev.breakdown);
  const notes = [...prev.breakdown.notes, `Teimosia Inabalável: ${prev.roll} repetido. O segundo resultado é obrigatório.`];
  if (ev.note) notes.push(ev.note);
  return { ...prev, rolls: [...prev.rolls, roll], roll, success: ev.success, critical: ev.critical, autoFail: ev.autoFail, rerolled: true, notes };
}

export type TestResult = SimpleTestResult | ActionTestResult;

export type Tier = 'critico' | 'sucesso' | 'falha';

export function tierOf(r: TestResult): Tier {
  if (r.kind === 'd20' && r.critical) return 'critico';
  return r.success ? 'sucesso' : 'falha';
}

const TIER_RANK: Record<Tier, number> = { falha: 0, sucesso: 1, critico: 2 };

export function bestTier(tiers: Tier[]): Tier {
  return tiers.reduce<Tier>((a, b) => (TIER_RANK[b] > TIER_RANK[a] ? b : a), 'falha');
}

/** Descrição textual para o registro de dados (seção 27.3). */
export function describeTest(r: TestResult, actorName?: string): string[] {
  const lines: string[] = [];
  lines.push(`Teste: ${r.label}${actorName ? ` — ${actorName}` : ''}`);
  if (r.kind === 'd6') {
    lines.push(`${ATTRIBUTE_LABELS[r.attribute]}: ${r.value}${r.effective !== r.value ? ` (efetivo ${r.effective})` : ''}`);
    lines.push(r.impossible ? 'D6: —' : `D6: ${r.roll}`);
  } else {
    const b = r.breakdown;
    lines.push(`${ATTRIBUTE_LABELS[b.attribute]}: ${b.attributeValue}`);
    if (b.hasSpecialty) {
      const label = b.kind === 'bonus' ? `Especialidade + bônus (${b.appliedBonus?.name})` : b.kind === 'onus' ? `Especialidade sob ônus (${b.appliedOnus?.name})` : 'Especialidade';
      lines.push(`${label}: +${b.base}`);
    } else {
      lines.push('Sem especialidade: apenas o atributo');
    }
    if (b.traitModifier) lines.push(`Traço: +${b.traitModifier}`);
    lines.push(`Limite: ${b.limit}`);
    lines.push(r.impossible ? 'D20: —' : `D20: ${r.rolls.join(' → ')}`);
  }
  for (const n of r.notes) lines.push(n);
  const res = r.impossible ? 'Impossível' : r.kind === 'd20' && r.critical ? 'CRÍTICO' : r.success ? 'Sucesso' : 'Falha';
  lines.push(`Resultado: ${res}.`);
  return lines;
}
