import type { HorrorEventId } from '../sanity';
import type { CaseStatus, FactionId, ObjectiveStatus, TrackId } from '../state';
import type { AttributeId, CharacterId, ContextTag, ProfessionId } from '../types';
import type { DamageTypeId } from '../../data/items';

// ---------------------------------------------------------------------------
// Condições
// ---------------------------------------------------------------------------

export interface Condition {
  flag?: string;
  notFlag?: string;
  clue?: string;
  notClue?: string;
  /** Presente na cena. */
  hasCharacter?: CharacterId;
  /** Faz parte do grupo (presente ou não). */
  inParty?: CharacterId;
  notCharacter?: CharacterId;
  hasProfession?: ProfessionId;
  notProfession?: ProfessionId;
  contactIs?: CharacterId;
  contactIsNot?: CharacterId;
  hasItem?: string;
  notItem?: string;
  used?: string; // "sceneId:interactionId"
  notUsed?: string;
  minTrust?: { npc: string; value: number };
  maxTrust?: { npc: string; value: number };
  all?: Condition[];
  any?: Condition[];
  not?: Condition;
}

export interface TextBlock {
  text: string;
  if?: Condition;
  speaker?: string;
}

// ---------------------------------------------------------------------------
// Efeitos persistentes
// ---------------------------------------------------------------------------

export type Effect =
  | { type: 'clue'; id: string; extra?: string }
  | { type: 'flag'; key: string; value?: boolean | number | string }
  | { type: 'item'; itemId: string; to?: 'actor' | CharacterId }
  | { type: 'removeItem'; itemId: string }
  | { type: 'time'; minutes: number }
  | { type: 'sanity'; event: HorrorEventId; who: 'todos' | 'actor' }
  | { type: 'damage'; damageType: DamageTypeId; who: 'actor' }
  | { type: 'xp'; amount: number; who: 'todos' | 'actor' }
  | { type: 'trust'; npc: string; delta: number }
  | { type: 'npcState'; npc: string; state: string }
  | { type: 'meet'; npc: string }
  | { type: 'track'; track: TrackId; delta: number }
  | { type: 'attention'; faction: FactionId; delta: number }
  | { type: 'knowledge'; delta: number }
  | { type: 'objective'; id: string; status: ObjectiveStatus }
  | { type: 'case'; id: string; status: CaseStatus }
  | { type: 'decision'; id: string; label: string }
  | { type: 'document'; id: string }
  | { type: 'location'; id: string }
  | { type: 'event'; text: string }
  | { type: 'goto'; scene: string }
  | { type: 'dialogue'; id: string; node?: string }
  | { type: 'endDialogue' }
  | { type: 'combat'; encounter: string }
  | { type: 'narrate'; text: string; kind?: 'texto' | 'perigo' | 'sistema' }
  | { type: 'restUntil'; hour: number }
  | { type: 'join'; who: CharacterId }
  | { type: 'leave'; who: CharacterId }
  | { type: 'endChapter' };

// ---------------------------------------------------------------------------
// Testes em cenas
// ---------------------------------------------------------------------------

export interface TestSpec {
  kind: 'd6' | 'd20';
  label: string;
  attribute: AttributeId;
  /** Especialidade considerada (D20). Sem ela, limite = atributo. */
  specialty?: string;
  /** Especialidades alternativas igualmente pertinentes (usa a melhor que o personagem tiver). */
  altSpecialties?: string[];
  tags?: ContextTag[];
  allowCooperation?: boolean;
}

export interface Outcome {
  text: TextBlock[];
  effects?: Effect[];
  next?: string | null;
}

export interface Outcomes {
  critico?: Outcome;
  sucesso: Outcome;
  falha: Outcome;
  /** Informação adicional quando algum ajudante tem sucesso. */
  cooperacao?: Outcome;
}

export type InteractionKind = 'examinar' | 'dialogo' | 'investigar' | 'acao' | 'mover' | 'esperar';

export interface Interaction {
  id: string;
  label: string;
  kind: InteractionKind;
  if?: Condition;
  once?: boolean;
  timeCost?: number;
  text?: TextBlock[];
  effects?: Effect[];
  test?: TestSpec;
  outcomes?: Outcomes;
  /** Nota visível ao jogador sobre o que está em jogo. */
  hint?: string;
  /** Imagem mostrada ao executar a interação (id de slot em data/images). */
  image?: string;
}

export interface Scene {
  id: string;
  title: string;
  location: string;
  caseId?: string;
  intro: TextBlock[];
  onEnter?: Effect[];
  /** Etiquetas de ambiente aplicadas a todos os testes da cena. */
  ambientTags?: ContextTag[];
  /** Sinal do Instinto de Perigo — sem revelar a origem. */
  dangerSense?: string;
  /** Imagem da cena (id de slot em data/images). */
  image?: string;
  /** Há telefone: permite chamar protagonistas ausentes, se a condição valer. */
  phone?: Condition;
  /** NPCs presentes fora de diálogo (para improviso do narrador). */
  npcs?: string[];
  interactions: Interaction[];
}

// ---------------------------------------------------------------------------
// Diálogos
// ---------------------------------------------------------------------------

export interface DialogueOption {
  id: string;
  label: string;
  if?: Condition;
  once?: boolean;
  next?: string | null;
  effects?: Effect[];
  test?: TestSpec;
  outcomes?: Outcomes;
}

export interface DialogueNode {
  speaker?: string;
  text: TextBlock[];
  effects?: Effect[];
  options: DialogueOption[];
}

export interface Dialogue {
  id: string;
  npc: string;
  /** Imagem mostrada durante a conversa. */
  image?: string;
  start: string;
  nodes: Record<string, DialogueNode>;
}

// ---------------------------------------------------------------------------
// Pistas, NPCs, documentos, objetivos, casos, encontros
// ---------------------------------------------------------------------------

export type ClueImportance = 'essencial' | 'importante' | 'secundaria';

export interface ClueDef {
  id: string;
  caseId: string;
  title: string;
  description: string;
  location: string;
  characters: string[];
  importance: ClueImportance;
  related: string[];
  /** Revelado apenas se alguém com Memória Fotográfica estava presente. */
  memoryDetail?: string;
  image?: string;
}

export interface NpcDef {
  id: string;
  name: string;
  /** Como o grupo se refere ao NPC antes de saber o nome. */
  alias?: string;
  /** Papel como o jogador o conhece. */
  publicRole: string;
  location: string;
  initialTrust: number;
  /** Notas visíveis ao jogador após conhecer o NPC. */
  publicNotes: string;
}

export interface DocumentDef {
  id: string;
  title: string;
  content: string[];
}

export interface ObjectiveDef {
  id: string;
  caseId: string;
  text: string;
}

export interface CaseDef {
  id: string;
  title: string;
  summary: string;
  /** Personagem central (a investigação adapta-se se ele estiver ausente). */
  centralCharacter: CharacterId;
}

export interface EnvironmentInteraction {
  id: string;
  label: string;
  description: string;
  attribute: AttributeId;
  effect: 'quebrar_moral';
}

export interface EncounterDef {
  id: string;
  title: string;
  intro: string;
  enemies: string[];
  environment: EnvironmentInteraction[];
  onVictory: Effect[];
  onFlee: Effect[];
  onDefeat: Effect[];
  onEnemiesFled: Effect[];
}

/** Chamada telefônica para trazer um protagonista ausente. */
export interface CallScript {
  /** Onde está (aparece no painel do grupo enquanto ausente). */
  whereabouts: string;
  /** Minutos até chegar. */
  arrivalMinutes: number;
  call: TextBlock[];
  arrival: TextBlock[];
  effects?: Effect[];
}

/** Roteiro de improviso de uma cena: o que existe ali (sem pistas novas). */
export interface SceneBrief {
  ambiente: string;
  objetos: string[];
}

/** Roteiro de improviso de um NPC: como fala, o que sabe, o que evita. */
export interface NpcBrief {
  persona: string;
  estilo: string;
  sabe: string[];
  evita: string[];
  naoSabe?: string[];
}
