import '../data/campaign';
import { createCharacter, type CharacterSelection } from '../engine/party';
import type { CharacterId, CharacterState } from '../engine/types';

export const DEFAULT_SELECTION: Record<CharacterId, CharacterSelection> = {
  jack: { id: 'jack', specialties: ['deducao', 'investigacao_de_campo', 'interrogatorio'], bonuses: ['olho_clinico', 'teimosia_inabalavel'], control: 'jogador' },
  daniel: { id: 'daniel', specialties: ['primeiros_socorros', 'cirurgia', 'psiquiatria'], bonuses: ['foco_absoluto', 'sangue_frio'], control: 'ia' },
  mick: { id: 'mick', specialties: ['armas_curtas', 'combate_corpo_a_corpo', 'lideranca_tatica'], bonuses: ['mira_perfeita', 'resistente'], control: 'ia' },
  liz: { id: 'liz', specialties: ['persuasao', 'entrevistas', 'fontes_contatos'], bonuses: ['labia', 'presenca_marcante'], control: 'ia' },
  maggie: { id: 'maggie', specialties: ['simbologia', 'historia_oculta', 'rituais'], bonuses: ['memoria_fotografica', 'leitor_de_pessoas'], control: 'ia' },
  ray: { id: 'ray', specialties: ['arrombamento', 'furtividade', 'evasao'], bonuses: ['maos_habilidosas', 'agil'], control: 'ia' },
};

export function makeChar(id: CharacterId, patch: Partial<CharacterSelection> = {}, state: Partial<CharacterState> = {}): CharacterState {
  return { ...createCharacter({ ...DEFAULT_SELECTION[id], ...patch }), ...state };
}

export function partySelection(ids: CharacterId[]): CharacterSelection[] {
  return ids.map((id) => DEFAULT_SELECTION[id]);
}

import { chooseOption, interact } from '../state/session';
import type { GameState } from '../engine/state';

/** Joga as cenas “Enquanto isso” até voltar ao grupo. */
export function playInterludes(s: GameState): GameState {
  for (let guard = 0; guard < 4 && s.sceneId.startsWith('interludio_'); guard++) {
    if (s.sceneId === 'interludio_bellevue') {
      s = interact(s, 'anotacoes');
      s = interact(s, 'chefia');
      s = chooseOption(s, 'assinar');
      s = interact(s, 'balcao');
      s = interact(s, 'fim_plantao');
    } else if (s.sceneId === 'interludio_voice') {
      s = interact(s, 'atender');
      s = chooseOption(s, 'anonimato');
      s = chooseOption(s, 'encontro');
      s = chooseOption(s, 'fim');
      s = interact(s, 'editor');
      s = chooseOption(s, 'esconder');
      s = interact(s, 'sair_redacao');
    }
  }
  return s;
}

/** Recebe Victoria, decide e joga as cenas intercaladas. */
export function meetAndDecide(s: GameState, accept: boolean): GameState {
  s = interact(s, 'esperar_cliente');
  s = chooseOption(s, 'quem');
  s = chooseOption(s, 'voltar');
  s = chooseOption(s, accept ? 'aceitar' : 'recusar');
  s = chooseOption(s, 'fim');
  return playInterludes(s);
}
