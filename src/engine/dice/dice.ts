import type { Dice } from '../types';

/** Gerador pseudoaleatório serializável (mulberry32). */
export interface Rng {
  next(): number;
  readonly state: number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  return {
    next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    get state() {
      return s;
    },
  };
}

export function diceFromRng(rng: Rng): Dice {
  return {
    d6: () => 1 + Math.floor(rng.next() * 6),
    d20: () => 1 + Math.floor(rng.next() * 20),
  };
}

export function newSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/** Dados com resultados predeterminados — usados nos testes automatizados. */
export function fixedDice(seq: { d6?: number[]; d20?: number[] }): Dice & { remaining(): { d6: number; d20: number } } {
  const d6 = [...(seq.d6 ?? [])];
  const d20 = [...(seq.d20 ?? [])];
  return {
    d6() {
      const v = d6.shift();
      if (v === undefined) throw new Error('fixedDice: D6 esgotado');
      return v;
    },
    d20() {
      const v = d20.shift();
      if (v === undefined) throw new Error('fixedDice: D20 esgotado');
      return v;
    },
    remaining: () => ({ d6: d6.length, d20: d20.length }),
  };
}
