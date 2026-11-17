import { BONUS_BY_ID, type BonusDef } from '../data/bonuses';
import { rules } from '../config/rules';
import type { ContextTag } from './types';

export type ModifierKind = 'nenhum' | 'especialidade' | 'bonus' | 'onus';

export interface BonusResolution {
  kind: ModifierKind;
  bonus?: BonusDef;
  onus?: BonusDef;
  notes: string[];
}

function activationMatches(b: BonusDef, tags: Set<ContextTag>): boolean {
  return b.activation.some((t) => tags.has(t));
}

export function onusApplies(b: BonusDef, tags: Set<ContextTag>): boolean {
  const o = b.onus;
  if (!o) return false;
  if (o.exceptWhen?.some((t) => tags.has(t))) return false;
  if (o.requiresActivation && !activationMatches(b, tags)) return false;
  let triggered = false;
  if (o.whenAny) triggered = o.whenAny.some((t) => tags.has(t));
  if (o.whenMissing) triggered = triggered || o.whenMissing.every((t) => !tags.has(t));
  return triggered;
}

export function bonusApplies(b: BonusDef, tags: Set<ContextTag>): boolean {
  return b.positiveModifier > 0 && activationMatches(b, tags) && !onusApplies(b, tags);
}

/**
 * Determina qual modificador de especialidade vale para uma ação.
 * Regras canônicas: bônus e ônus não acumulam, não se sobrepõem e não se anulam;
 * nunca se aplicam sem a especialidade correspondente.
 * Quando um bônus e um ônus disparam ao mesmo tempo (de bônus diferentes),
 * a precedência é PROVISÓRIA (P-02).
 */
export function resolveBonuses(bonusIds: string[], tagList: ContextTag[], hasSpecialty: boolean): BonusResolution {
  const tags = new Set(tagList);
  const defs = bonusIds.map((id) => BONUS_BY_ID[id]).filter(Boolean);
  const notes: string[] = [];

  if (!hasSpecialty) {
    const would = defs.filter((b) => bonusApplies(b, tags) || onusApplies(b, tags));
    if (would.length) notes.push(`Sem a especialidade: ${would.map((b) => b.name).join(', ')} não se aplica.`);
    return { kind: 'nenhum', notes };
  }

  const onus = defs.find((b) => onusApplies(b, tags));
  const bonus = defs.find((b) => bonusApplies(b, tags));

  if (onus && bonus) {
    const policy = rules.bonusOnusConflict;
    notes.push(`Conflito entre bônus (${bonus.name}) e ônus (${onus.name}) — política provisória: ${policy.replace('_', ' ')}.`);
    if (policy === 'onus_prevalece') return { kind: 'onus', onus, notes };
    if (policy === 'bonus_prevalece') return { kind: 'bonus', bonus, notes };
    return { kind: 'especialidade', notes };
  }
  if (onus) return { kind: 'onus', onus, notes };
  if (bonus) return { kind: 'bonus', bonus, notes };
  return { kind: 'especialidade', notes };
}
