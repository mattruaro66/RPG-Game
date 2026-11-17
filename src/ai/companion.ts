/**
 * IA dos companheiros e dos inimigos.
 * Decide ações de acordo com a personalidade de cada protagonista
 * (agressividade, cautela, cuidado), sempre dentro das ações que o motor
 * de regras permite — a IA nunca cria regras ou modificadores.
 */
import { CHARACTER_BY_ID, shortName, type CompanionTrigger } from '../data/characters';
import { ITEM_BY_ID } from '../data/items';
import { bestWeaponUid, eligibleHelpers, isAble, partyMember, type CombatAction } from '../engine/combat/combat';
import { canTreat, TREATMENTS } from '../engine/medical';
import { canAct, isPlayable } from '../engine/sanity';
import type { GameState } from '../engine/state';
import type { CharacterId, Dice } from '../engine/types';
import { activeParty } from '../engine/narrative/conditions';

function chance(dice: Dice, p: number): boolean {
  return dice.d20() <= Math.round(p * 20);
}

export function chooseEnemyAction(s: GameState, enemyId: string, dice: Dice): CombatAction {
  const targets = s.party.filter((c) => isAble(s, c.id));
  if (!targets.length) return { type: 'defender' };
  const t = targets[(dice.d20() - 1) % targets.length];
  void enemyId;
  return { type: 'atacar', targetId: t.id, weaponUid: null };
}

export function chooseCompanionAction(s: GameState, id: CharacterId, dice: Dice): CombatAction {
  const me = partyMember(s, id)!;
  const p = CHARACTER_BY_ID[id].ai;
  const cb = s.combat!;
  const myCb = cb.combatants[id];
  const enemies = Object.values(cb.enemies).filter((e) => isAble(s, e.uid));

  // 1. Cuidar dos feridos (Médico ou quem tiver especialidade de tratamento).
  const treatSpecs = me.specialties.filter((sp) => TREATMENTS[sp]);
  if (treatSpecs.length && p.care >= 0.5) {
    const wounded = s.party
      .filter((c) => c.status !== 'morto' && c.hp <= 10 && cb.combatants[c.id] && !cb.combatants[c.id].fled)
      .sort((a, b) => a.hp - b.hp);
    for (const w of wounded) {
      const spec = treatSpecs.find((sp) => canTreat(me, w, sp).ok);
      if (spec) return { type: 'tratar', targetId: w.id, specialty: spec };
    }
  }

  // 2. Fugir quando muito ferido e cauteloso.
  if (me.hp <= 6 && chance(dice, p.caution)) return { type: 'fugir' };

  // 3. Procurar cobertura.
  if (!myCb.inCover && chance(dice, p.caution * 0.6)) return { type: 'cobertura' };

  // 4. Empunhar uma arma guardada.
  const weaponUid = bestWeaponUid(me);
  if (!weaponUid) {
    const stored = me.inventory.bag.find((i) => ITEM_BY_ID[i.itemId]?.weapon);
    if (stored && me.inventory.hands.length < 2 && p.aggression >= 0.3) return { type: 'usar_item', itemUid: stored.uid };
  }

  // 5. Atacar o inimigo mais ferido.
  if (enemies.length && (weaponUid || chance(dice, p.aggression))) {
    const target = [...enemies].sort((a, b) => a.hp - b.hp)[0];
    return { type: 'atacar', targetId: target.uid, weaponUid };
  }

  return { type: 'defender' };
}

/** Sugere ajudantes para uma ação cooperativa, segundo a personalidade. */
export function suggestHelpers(s: GameState, actorId: string): CharacterId[] {
  return eligibleHelpers(s, actorId).filter((h) => CHARACTER_BY_ID[h].ai.aggression >= 0.6).slice(0, 1);
}

/** Fala de um companheiro controlado pela IA para uma situação. */
export function companionLine(s: GameState, trigger: CompanionTrigger, dice: Dice, exclude?: CharacterId): { speaker: string; text: string } | null {
  const candidates = activeParty(s).filter((c) => c.control === 'ia' && isPlayable(c) && canAct(c) && c.id !== exclude && CHARACTER_BY_ID[c.id].ai.lines[trigger]?.length);
  if (!candidates.length) return null;
  const who = candidates[(dice.d20() - 1) % candidates.length];
  const lines = CHARACTER_BY_ID[who.id].ai.lines[trigger]!;
  return { speaker: shortName(CHARACTER_BY_ID[who.id]), text: lines[(dice.d20() - 1) % lines.length] };
}
