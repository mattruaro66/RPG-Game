// Tipos centrais do motor de regras. Sem dependência de React.

export type AttributeId = 'fisico' | 'reflexo' | 'raciocinio' | 'presenca' | 'espirito';

export const ATTRIBUTE_IDS: AttributeId[] = ['fisico', 'reflexo', 'raciocinio', 'presenca', 'espirito'];

export const ATTRIBUTE_LABELS: Record<AttributeId, string> = {
  fisico: 'Físico',
  reflexo: 'Reflexo',
  raciocinio: 'Raciocínio',
  presenca: 'Presença',
  espirito: 'Espírito',
};

export type Attributes = Record<AttributeId, number>;

export type ProfessionId =
  | 'investigador'
  | 'medico'
  | 'operativo'
  | 'jornalista'
  | 'ocultista'
  | 'infiltrador';

export const PROFESSION_LABELS: Record<ProfessionId, string> = {
  investigador: 'Investigador',
  medico: 'Médico',
  operativo: 'Operativo',
  jornalista: 'Jornalista',
  ocultista: 'Ocultista',
  infiltrador: 'Infiltrador',
};

export type CharacterId = 'jack' | 'daniel' | 'mick' | 'liz' | 'maggie' | 'ray';

/**
 * Etiquetas de contexto de uma ação. Bônus e ônus só se aplicam quando
 * a etiqueta correspondente está presente — nunca de forma automática.
 */
export type ContextTag =
  // percepção / análise
  | 'perceber_detalhes'
  | 'interpretar_pessoas'
  | 'envolvimento_emocional'
  | 'perceber_ameaca'
  | 'planejamento'
  | 'avaliacao_risco'
  | 'antecipacao'
  | 'concentracao'
  | 'execucao_cuidadosa'
  | 'solucao_criativa'
  // social
  | 'argumentacao'
  | 'persuasao'
  | 'negociacao'
  | 'autoridade'
  | 'impacto_social'
  | 'passar_despercebido'
  | 'adaptacao_social'
  | 'intimidacao'
  | 'provocacao'
  | 'pressao_psicologica'
  | 'empatia'
  | 'consolar'
  | 'ajudar_outro'
  | 'ambiente_com_estranhos'
  | 'contradito'
  // físico
  | 'arma_longo_alcance'
  | 'equilibrio'
  | 'coordenacao'
  | 'movimentacao'
  | 'esforco_fisico'
  | 'fadiga'
  | 'adversidade_fisica'
  | 'reacao_inesperada'
  | 'combate_desarmado'
  | 'tecnica_marcial'
  | 'precisao_manual'
  | 'reparo'
  | 'mecanismo'
  | 'maos_feridas'
  // situação
  | 'combate'
  | 'perigo_real'
  | 'superar_adversidade'
  | 'sob_pressao'
  | 'paranoia';

export interface Dice {
  d6(): number;
  d20(): number;
}

export type LifeStatus = 'ativo' | 'portas_da_morte' | 'morto';

export type ControlMode = 'jogador' | 'ia';

export interface ItemInstance {
  uid: string;
  itemId: string;
  state?: string;
}

export interface InventoryState {
  hands: ItemInstance[];
  bag: ItemInstance[];
  pockets: ItemInstance[];
}

export interface CharacterState {
  id: CharacterId;
  name: string;
  profession: ProfessionId;
  attributes: Attributes;
  specialties: string[];
  bonuses: string[];
  hp: number;
  maxHp: number;
  status: LifeStatus;
  sanity: number;
  xp: number;
  improvementsSpent: number;
  inventory: InventoryState;
  control: ControlMode;
  lastSanityRecoveryDay: number | null;
  lastPsychiatryGivenDay: number | null;
  history: string[];
}
