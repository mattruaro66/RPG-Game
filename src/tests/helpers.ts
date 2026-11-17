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
