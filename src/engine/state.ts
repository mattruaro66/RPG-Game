import type { CreatureKind, EnemyTrait } from '../data/enemies';
import type { Tier, TestResult } from './checks';
import type { EnemyStatus } from './damage';
import type { Attributes, CharacterId, CharacterState, ItemInstance } from './types';

export const SAVE_VERSION = 1;

// ---------------------------------------------------------------------------
// Camada interna da campanha (nunca exibida ao jogador fora do Modo Mestre)
// ---------------------------------------------------------------------------

export type TrackId =
  | 'atividade_sangues_ralos'
  | 'investigacao_camarilla'
  | 'avanco_necromantes'
  | 'exposicao_mascara'
  | 'risco_protagonistas'
  | 'preparacao_ritual';

export const TRACK_LABELS: Record<TrackId, string> = {
  atividade_sangues_ralos: 'Atividade dos Sangues-Ralos',
  investigacao_camarilla: 'Investigação da Camarilla',
  avanco_necromantes: 'Avanço dos necromantes',
  exposicao_mascara: 'Exposição da Máscara',
  risco_protagonistas: 'Risco para os protagonistas',
  preparacao_ritual: 'Preparação do ritual',
};

export type FactionId =
  | 'camarilla' | 'ventrue' | 'toreador' | 'tremere' | 'nosferatu' | 'brujah' | 'malkavian' | 'gangrel'
  | 'necromantes' | 'sangues_ralos' | 'policia' | 'imprensa';

export interface InternalLayer {
  tracks: Record<TrackId, number>;
  factionAttention: Partial<Record<FactionId, number>>;
  /** 0 = ignorância total sobre vampiros. Escala PROVISÓRIA. */
  vampireKnowledge: number;
  lastTickDay: number;
}

// ---------------------------------------------------------------------------
// Camada do jogador
// ---------------------------------------------------------------------------

export interface DiscoveredClue {
  id: string;
  time: number;
  sceneId: string;
  witnesses: CharacterId[];
  /** Informações adicionais desbloqueadas (ex.: por crítico ou cooperação). */
  extras: string[];
}

export type ObjectiveStatus = 'ativo' | 'concluido' | 'falhou';
export type CaseStatus = 'ativo' | 'aguardando' | 'encerrado';

export interface Journal {
  clues: DiscoveredClue[];
  people: string[];
  locations: string[];
  documents: string[];
  hypotheses: { id: string; text: string; time: number }[];
  events: { time: number; text: string }[];
  objectives: { id: string; status: ObjectiveStatus }[];
  cases: { id: string; status: CaseStatus }[];
}

export interface NpcState {
  trust: number;
  met: boolean;
  state: string;
}

export type NarrativeKind = 'cena' | 'texto' | 'fala' | 'teste' | 'sistema' | 'ia' | 'perigo';

export interface NarrativeEntry {
  id: number;
  kind: NarrativeKind;
  text: string;
  speaker?: string;
  time: number;
}

export interface DiceLogEntry {
  id: number;
  time: number;
  actor?: string;
  lines: string[];
  outcome: string;
}

export type TestSource =
  | { type: 'interaction'; sceneId: string; interactionId: string }
  | { type: 'dialogue'; dialogueId: string; nodeId: string; optionId: string };

export interface PendingTest {
  source: TestSource;
  actorId: CharacterId;
  helperIds: CharacterId[];
  main: TestResult;
  helpers: { id: CharacterId; result: TestResult }[];
}

// ---------------------------------------------------------------------------
// Combate
// ---------------------------------------------------------------------------

export interface EnemyInstance {
  uid: string;
  templateId: string;
  name: string;
  kind: CreatureKind;
  attributes: Attributes;
  specialties: string[];
  hp: number;
  maxHp: number;
  status: EnemyStatus;
  criticalHits: number;
  traits: EnemyTrait[];
  weaponItemId: string | null;
}

export interface Combatant {
  id: string;
  side: 'grupo' | 'inimigos';
  initiative: number;
  initiativeRolls: number[];
  inCover: boolean;
  defending: boolean;
  fled: boolean;
}

export type CombatResult = 'vitoria' | 'fuga' | 'derrota' | 'inimigos_fugiram';

export interface CombatState {
  encounterId: string;
  round: number;
  order: string[];
  turnIndex: number;
  /** Quem já agiu na rodada atual. */
  acted: string[];
  combatants: Record<string, Combatant>;
  enemies: Record<string, EnemyInstance>;
  log: string[];
  result: CombatResult | null;
  moraleBroken: boolean;
  interactionsUsed: string[];
}

// ---------------------------------------------------------------------------
// Estado global serializável
// ---------------------------------------------------------------------------

export interface GameState {
  version: number;
  seed: number;
  rngState: number;
  createdAt: string;
  party: CharacterState[];
  /** Personagem que recebe Victoria (adapta-se à composição do grupo). */
  contactId: CharacterId;
  time: number;
  sceneId: string;
  visitedScenes: string[];
  usedInteractions: string[];
  flags: Record<string, boolean | number | string>;
  journal: Journal;
  npcs: Record<string, NpcState>;
  internal: InternalLayer;
  decisions: { id: string; label: string; time: number }[];
  groundItems: Record<string, ItemInstance[]>;
  combat: CombatState | null;
  dialogue: { dialogueId: string; nodeId: string } | null;
  pendingTest: PendingTest | null;
  narrative: NarrativeEntry[];
  diceLog: DiceLogEntry[];
  seq: number;
  gameOver: null | { reason: string };
  lastTier?: Tier;
}
