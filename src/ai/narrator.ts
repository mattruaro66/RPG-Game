/**
 * Narrador (mestre) do modo solo.
 *
 * O protótipo usa um narrador LOCAL: as cenas são escritas, e o narrador
 * acrescenta ambientação e reações dos companheiros controlados pela IA,
 * sempre embasado no estado do jogo e nas regras do motor.
 *
 * A interface NarratorProvider permite, no futuro, conectar um modelo de
 * linguagem (PENDENTE P-26) sem alterar o motor: o provedor só pode propor
 * texto — efeitos mecânicos continuam vindo do motor e dos dados da campanha.
 */
import type { CompanionTrigger } from '../data/characters';
import type { GameState } from '../engine/state';
import { periodOf, type Period } from '../engine/time';
import type { Dice } from '../engine/types';
import { companionLine } from './companion';

export interface NarratorProvider {
  id: string;
  ambient(s: GameState, dice: Dice): string | null;
  companion(s: GameState, trigger: CompanionTrigger, dice: Dice): { speaker: string; text: string } | null;
}

const AMBIENT: Record<Period, string[]> = {
  madrugada: ['A cidade parece prender a respiração. Só os táxis e os bêbados continuam acordados.', 'Um trem do metrô passa sob a rua; o chão vibra como um coração cansado.'],
  manha: ['O céu de dezembro tem cor de jornal velho.', 'O cheiro de café e de fumaça de escapamento sobe das esquinas.'],
  tarde: ['A luz vai embora cedo em dezembro. Às quatro, os postes já se acendem.', 'Buzinas. Vendedores de pretzel. Ninguém olha para ninguém.'],
  noite: ['Uma sirene ao longe, depois outra. Em Nova Iorque, sirenes são parte do silêncio.', 'O vapor dos bueiros sobe em colunas brancas sob a luz dos postes.', 'Faz frio. O tipo de frio que entra pelas costuras do casaco.'],
};

export const localNarrator: NarratorProvider = {
  id: 'local',
  ambient(s, dice) {
    const list = AMBIENT[periodOf(s.time)];
    if (dice.d6() > 2) return null; // nem toda cena precisa de ambientação extra
    return list[(dice.d20() - 1) % list.length];
  },
  companion(s, trigger, dice) {
    if (dice.d6() > 4) return null;
    return companionLine(s, trigger, dice);
  },
};
