import { CHARACTER_BY_ID, shortName } from '../../data/characters';
import { hasItem } from '../inventory';
import { isPlayable } from '../sanity';
import type { GameState } from '../state';
import type { Condition, TextBlock } from './types';

export function activeParty(s: GameState) {
  return s.party.filter(isPlayable);
}

export function evaluate(cond: Condition | undefined, s: GameState): boolean {
  if (!cond) return true;
  const party = activeParty(s);
  if (cond.flag !== undefined && !s.flags[cond.flag]) return false;
  if (cond.notFlag !== undefined && s.flags[cond.notFlag]) return false;
  if (cond.clue && !s.journal.clues.some((c) => c.id === cond.clue)) return false;
  if (cond.notClue && s.journal.clues.some((c) => c.id === cond.notClue)) return false;
  if (cond.hasCharacter && !party.some((c) => c.id === cond.hasCharacter)) return false;
  if (cond.notCharacter && party.some((c) => c.id === cond.notCharacter)) return false;
  if (cond.hasProfession && !party.some((c) => c.profession === cond.hasProfession)) return false;
  if (cond.notProfession && party.some((c) => c.profession === cond.notProfession)) return false;
  if (cond.contactIs && s.contactId !== cond.contactIs) return false;
  if (cond.contactIsNot && s.contactId === cond.contactIsNot) return false;
  if (cond.hasItem && !party.some((c) => hasItem(c.inventory, cond.hasItem!))) return false;
  if (cond.notItem && party.some((c) => hasItem(c.inventory, cond.notItem!))) return false;
  if (cond.used && !s.usedInteractions.includes(cond.used)) return false;
  if (cond.notUsed && s.usedInteractions.includes(cond.notUsed)) return false;
  if (cond.minTrust && (s.npcs[cond.minTrust.npc]?.trust ?? 0) < cond.minTrust.value) return false;
  if (cond.maxTrust && (s.npcs[cond.maxTrust.npc]?.trust ?? 0) > cond.maxTrust.value) return false;
  if (cond.all && !cond.all.every((c) => evaluate(c, s))) return false;
  if (cond.any && !cond.any.some((c) => evaluate(c, s))) return false;
  if (cond.not && evaluate(cond.not, s)) return false;
  return true;
}

/**
 * Interpolação de textos:
 * {contato} nome curto do contato · {contato_completo} · {nome:jack} · {grupo}
 */
export function interpolate(text: string, s: GameState): string {
  const contact = CHARACTER_BY_ID[s.contactId];
  return text
    .replace(/\{contato\}/g, shortName(contact))
    .replace(/\{contato_completo\}/g, contact.name)
    .replace(/\{nome:(\w+)\}/g, (_, id: string) => {
      const d = CHARACTER_BY_ID[id as keyof typeof CHARACTER_BY_ID];
      return d ? shortName(d) : id;
    })
    .replace(/\{grupo\}/g, () => {
      const names = activeParty(s).map((c) => shortName(CHARACTER_BY_ID[c.id]));
      if (names.length <= 1) return names.join('');
      return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
    });
}

export function renderBlocks(blocks: TextBlock[] | undefined, s: GameState): { text: string; speaker?: string }[] {
  return (blocks ?? []).filter((b) => evaluate(b.if, s)).map((b) => ({ text: interpolate(b.text, s), speaker: b.speaker }));
}
