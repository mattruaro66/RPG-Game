import type { Attributes } from '../engine/types';

export type CreatureKind = 'humano' | 'ghoul' | 'vampiro' | 'vampiro_mestre' | 'morto_reanimado';

/** Traços canônicos de inimigos (seção 16). */
export type EnemyTrait =
  | 'criminoso_comum' // +1 Físico/Reflexo em combate; +1 Reflexo em grupo de 2+; não acumulam
  | 'capanga_profissional' // +1 Físico em corpo a corpo; não abandona o combate
  | 'nao_abandona_combate'
  | 'sem_vontade_propria';

export interface EnemyTemplate {
  id: string;
  name: string;
  kind: CreatureKind;
  attributes: Attributes;
  specialties: string[];
  hp: number;
  traits: EnemyTrait[];
  weaponItemId: string | null;
  description: string;
  /** Campos marcados PROVISÓRIO não foram definidos pelo criador. */
  provisional: string[];
}

export const ENEMY_TEMPLATES: EnemyTemplate[] = [
  {
    id: 'criminoso_faca', name: 'Criminoso com faca', kind: 'humano',
    attributes: { fisico: 2, reflexo: 2, raciocinio: 2, presenca: 1, espirito: 2 },
    specialties: ['combate_corpo_a_corpo'], hp: 10, traits: ['criminoso_comum'], weaponItemId: 'faca',
    description: 'Jaqueta de couro, olhar nervoso, lâmina na mão.',
    provisional: ['attributes', 'hp'],
  },
  {
    id: 'criminoso_revolver', name: 'Criminoso armado', kind: 'humano',
    attributes: { fisico: 2, reflexo: 2, raciocinio: 2, presenca: 1, espirito: 2 },
    specialties: ['armas_curtas'], hp: 10, traits: ['criminoso_comum'], weaponItemId: 'revolver_38',
    description: 'Mão trêmula no gatilho de um revólver barato.',
    provisional: ['attributes', 'hp'],
  },
  {
    id: 'capanga', name: 'Capanga profissional', kind: 'humano',
    attributes: { fisico: 3, reflexo: 2, raciocinio: 2, presenca: 2, espirito: 3 },
    specialties: ['combate_corpo_a_corpo'], hp: 12, traits: ['capanga_profissional', 'nao_abandona_combate'], weaponItemId: 'pe_de_cabra',
    description: 'Silencioso, treinado, pago para terminar o serviço.',
    provisional: ['attributes', 'hp', 'specialties'],
  },
  {
    id: 'morto_reanimado', name: 'Morto reanimado', kind: 'morto_reanimado',
    // CANÔNICO: Físico 2, Reflexo 2, PV 6. Demais atributos PROVISÓRIOS.
    attributes: { fisico: 2, reflexo: 2, raciocinio: 0, presenca: 0, espirito: 0 },
    specialties: [], hp: 6, traits: ['sem_vontade_propria', 'nao_abandona_combate'], weaponItemId: null,
    description: 'Algo que já foi alguém.',
    provisional: ['raciocinio', 'presenca', 'espirito', 'weapon'],
  },
];

export const ENEMY_BY_ID: Record<string, EnemyTemplate> = Object.fromEntries(ENEMY_TEMPLATES.map((e) => [e.id, e]));
