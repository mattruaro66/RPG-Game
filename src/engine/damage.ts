import { CANONICAL, rules } from '../config/rules';
import type { DamageTypeId } from '../data/items';
import type { CreatureKind } from '../data/enemies';
import type { Dice, LifeStatus } from './types';

// CANÔNICO: tabela de dano (seção 9.2). Não criar novos valores.
export const DAMAGE_TABLE: Record<DamageTypeId, { label: string; dice: 1 | 2; modifier: number }> = {
  desarmado: { label: 'Desarmado', dice: 1, modifier: -2 },
  improvisada: { label: 'Arma improvisada ou impacto leve', dice: 1, modifier: -1 },
  impacto_corte: { label: 'Arma de impacto ou corte', dice: 1, modifier: 0 },
  arma_de_fogo: { label: 'Arma de fogo', dice: 1, modifier: 2 },
  vampirico_pesado: { label: 'Ataque vampírico pesado', dice: 2, modifier: 0 },
  vampirico_excepcional: { label: 'Ataque vampírico excepcional', dice: 2, modifier: 2 },
};

export interface DamageRoll {
  type: DamageTypeId;
  rolls: number[];
  modifier: number;
  raw: number;
  base: number;
  critical: boolean;
  total: number;
  formula: string;
}

export function damageFormula(type: DamageTypeId): string {
  const d = DAMAGE_TABLE[type];
  const mod = d.modifier === 0 ? '' : d.modifier > 0 ? ` + ${d.modifier}` : ` − ${-d.modifier}`;
  return `${d.dice}D6${mod}`;
}

/** Dano crítico dobra o TOTAL, não apenas o dado. */
export function rollDamage(dice: Dice, type: DamageTypeId, critical: boolean): DamageRoll {
  const d = DAMAGE_TABLE[type];
  const rolls = Array.from({ length: d.dice }, () => dice.d6());
  const raw = rolls.reduce((a, b) => a + b, 0) + d.modifier;
  // P-01: política de dano mínimo para resultados negativos.
  const base = Math.max(rules.minDamage, raw);
  const total = critical ? base * 2 : base;
  return { type, rolls, modifier: d.modifier, raw, base, critical, total, formula: damageFormula(type) };
}

export interface Damageable {
  hp: number;
  maxHp: number;
  status: LifeStatus | EnemyStatus;
}

export type EnemyStatus = LifeStatus | 'destruido' | 'fugiu';

export interface DamageOutcome {
  hpBefore: number;
  hpAfter: number;
  statusBefore: string;
  statusAfter: string;
  died: boolean;
  enteredDeathsDoor: boolean;
  note: string;
}

/**
 * PV > 0: funcional. PV = 0: Às Portas da Morte. Qualquer dano adicional: morte.
 * P-05: dano excedente para em 0 (não mata diretamente).
 */
export function applyDamage<T extends Damageable>(target: T, amount: number): { target: T; outcome: DamageOutcome } {
  const before = { hp: target.hp, status: target.status };
  const t = { ...target };
  let note = '';
  if (t.status === 'morto' || t.status === 'destruido' || t.status === 'fugiu') {
    note = 'Alvo fora de combate.';
  } else if (amount <= 0) {
    note = 'Nenhum dano.';
  } else if (t.hp === 0 || t.status === 'portas_da_morte') {
    t.status = 'morto';
    note = 'Dano às portas da morte: morte.';
  } else {
    t.hp = Math.max(0, t.hp - amount);
    if (t.hp === 0) {
      t.status = 'portas_da_morte';
      note = 'Às Portas da Morte.';
    }
  }
  return {
    target: t,
    outcome: {
      hpBefore: before.hp,
      hpAfter: t.hp,
      statusBefore: before.status,
      statusAfter: t.status,
      died: t.status === 'morto' && before.status !== 'morto',
      enteredDeathsDoor: t.status === 'portas_da_morte' && before.status !== 'portas_da_morte',
      note,
    },
  };
}

// ---------------------------------------------------------------------------
// Letalidade sobrenatural (seção 11) — separada do cálculo de PV.
// ---------------------------------------------------------------------------

export interface LethalityInput {
  kind: CreatureKind;
  criticalHits: number;
  firearm: boolean;
  critical: boolean;
  isProtagonist: boolean;
}

export interface LethalityResult {
  criticalHits: number;
  killed: boolean;
  destroyed: boolean;
  note?: string;
}

export function applyLethalityRules(input: LethalityInput): LethalityResult {
  let crits = input.criticalHits;
  if (!(input.firearm && input.critical)) return { criticalHits: crits, killed: false, destroyed: false };
  crits += 1;
  if (input.kind === 'humano' || input.kind === 'ghoul') {
    const allowed = input.isProtagonist ? rules.firearmCritKillsProtagonists : rules.firearmCritKillsHumanEnemies;
    if (allowed) return { criticalHits: crits, killed: true, destroyed: false, note: 'Crítico com arma de fogo: ferimento fatal.' };
    return { criticalHits: crits, killed: false, destroyed: false };
  }
  if (input.kind === 'vampiro' || input.kind === 'vampiro_mestre') {
    const need = CANONICAL.vampireCritsToDestroy[input.kind];
    if (crits >= need) return { criticalHits: crits, killed: false, destroyed: true, note: `${need}º crítico com arma de fogo: o vampiro é destruído.` };
    return { criticalHits: crits, killed: false, destroyed: false, note: `Crítico ${crits}/${need}. Balas comuns não bastam.` };
  }
  return { criticalHits: crits, killed: false, destroyed: false };
}
