import { CANONICAL } from '../config/rules';
import type { CharacterState } from './types';

export function addXp(c: CharacterState, amount: number): CharacterState {
  return { ...c, xp: Math.max(0, c.xp + amount) };
}

/** A cada 20 XP, uma melhoria de +1. O destino do +1 é PENDENTE (P-16). */
export function improvementsEarned(c: CharacterState): number {
  return Math.floor(c.xp / CANONICAL.xpPerImprovement);
}

export function improvementsAvailable(c: CharacterState): number {
  return Math.max(0, improvementsEarned(c) - c.improvementsSpent);
}

export function xpToNext(c: CharacterState): number {
  return CANONICAL.xpPerImprovement - (c.xp % CANONICAL.xpPerImprovement);
}
