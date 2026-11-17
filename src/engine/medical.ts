import { CANONICAL, rules } from '../config/rules';
import { actionTest, type ActionTestResult } from './checks';
import { characterLimit } from './character';
import type { CharacterState, ContextTag, Dice } from './types';

// CANÔNICO (seção 12.1)
export const TREATMENTS: Record<string, { label: string; dice: 1; modifier: number }> = {
  primeiros_socorros: { label: 'Primeiros Socorros', dice: 1, modifier: 1 },
  medicina_emergencia: { label: 'Medicina de Emergência', dice: 1, modifier: 1 },
  cirurgia: { label: 'Cirurgia', dice: 1, modifier: 1 },
  farmacologia: { label: 'Farmacologia', dice: 1, modifier: -1 },
};
// Medicina Legal não recupera PV.

export interface TreatmentResult {
  ok: boolean;
  reason?: string;
  test?: ActionTestResult;
  healRoll?: number;
  healed: number;
  healer: CharacterState;
  target: CharacterState;
}

export function canTreat(healer: CharacterState, target: CharacterState, specialty: string): { ok: boolean; reason?: string } {
  if (!TREATMENTS[specialty]) return { ok: false, reason: 'Esta especialidade não recupera PV.' };
  if (healer.status !== 'ativo' || healer.sanity <= 0) return { ok: false, reason: 'O socorrista não está em condições de agir.' };
  if (target.status === 'morto') return { ok: false, reason: 'Não há o que fazer.' };
  if (healer.id === target.id && rules.selfTreatmentForbidden.includes(specialty)) return { ok: false, reason: 'Procedimentos complexos não podem ser realizados em si mesmo.' };
  if (target.hp === 0 && rules.treatmentAtZeroHp === 'proibido') return { ok: false, reason: 'Estabilização às portas da morte: regra pendente.' };
  if (target.hp >= target.maxHp) return { ok: false, reason: 'PV já no máximo.' };
  return { ok: true };
}

/**
 * Tratamento consome um turno. P-06: exige teste D20 (Raciocínio + especialidade).
 * A recuperação respeita o limite de 20 PV.
 */
export function treat(dice: Dice, healer: CharacterState, target: CharacterState, specialty: string, ambientTags: ContextTag[] = []): TreatmentResult {
  const can = canTreat(healer, target, specialty);
  if (!can.ok) return { ok: false, reason: can.reason, healed: 0, healer, target };
  const def = TREATMENTS[specialty];
  let test: ActionTestResult | undefined;
  if (rules.treatmentRequiresTest) {
    const tags: ContextTag[] = ['execucao_cuidadosa', 'ajudar_outro'];
    const b = characterLimit(healer, { attribute: rules.treatmentAttribute, specialty, tags }, ambientTags);
    test = actionTest(dice, def.label, b);
    if (!test.success) return { ok: true, test, healed: 0, healer, target };
  }
  const healRoll = dice.d6();
  const amount = Math.max(0, healRoll + def.modifier);
  const hp = Math.min(CANONICAL.maxHp, target.hp + amount);
  const healed = hp - target.hp;
  const newTarget: CharacterState = { ...target, hp, status: hp > 0 && target.status === 'portas_da_morte' ? 'ativo' : target.status };
  return { ok: true, test, healRoll, healed, healer: healer.id === target.id ? newTarget : healer, target: newTarget };
}
