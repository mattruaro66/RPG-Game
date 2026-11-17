import { CANONICAL, rules } from '../../config/rules';
import type { Dice } from '../types';

export interface InitiativeParticipant {
  id: string;
  /** Possui especialidade pertinente ao combate (+2). */
  relevantSpecialty: boolean;
  /** Operativo em combate (+1 automático). */
  operativo: boolean;
}

export interface InitiativeEntry {
  id: string;
  roll: number;
  bonus: number;
  total: number;
  tiebreaks: number[];
}

/**
 * Iniciativa: D6 + 2 (especialidade pertinente) + 1 (Operativo). Acumuláveis.
 * Empates: nova rolagem entre os empatados. Se persistirem após o limite
 * (P-03), mantém-se a ordem de entrada (decisão do narrador).
 */
export function rollInitiative(dice: Dice, participants: InitiativeParticipant[]): InitiativeEntry[] {
  const entries: InitiativeEntry[] = participants.map((p) => {
    const roll = dice.d6();
    const bonus = (p.relevantSpecialty ? CANONICAL.initiativeSpecialtyBonus : 0) + (p.operativo ? CANONICAL.initiativeOperativoBonus : 0);
    return { id: p.id, roll, bonus, total: roll + bonus, tiebreaks: [] };
  });

  const resolve = (group: InitiativeEntry[], depth: number): InitiativeEntry[] => {
    if (group.length <= 1 || depth >= rules.initiativeMaxRerolls) return group;
    const rolled = group.map((e) => {
      const r = dice.d6();
      e.tiebreaks.push(r);
      return { e, r };
    });
    const values = [...new Set(rolled.map((x) => x.r))].sort((a, b) => b - a);
    return values.flatMap((v) => resolve(rolled.filter((x) => x.r === v).map((x) => x.e), depth + 1));
  };

  const totals = [...new Set(entries.map((e) => e.total))].sort((a, b) => b - a);
  return totals.flatMap((t) => resolve(entries.filter((e) => e.total === t), 0));
}

/**
 * Cooperação malsucedida: o ajudante passa para o final da fila;
 * a ordem relativa dos demais permanece inalterada.
 */
export function moveToEndOfQueue(order: string[], id: string): string[] {
  if (!order.includes(id)) return order;
  return [...order.filter((x) => x !== id), id];
}
