/**
 * Parâmetros de regras.
 *
 * CANONICAL: estabelecido pelo criador. Não alterar.
 * PROVISIONAL: solução técnica reversível para o protótipo funcionar.
 *   Cada item referencia um código em PENDING_DECISIONS.md (P-xx).
 */
import type { AttributeId } from '../engine/types';

export const CANONICAL = {
  attributeMin: 0,
  attributeMax: 5,
  attributePointsPerCharacter: 13,
  partySize: 4,
  specialtiesPerCharacter: 3,
  bonusesPerCharacter: 2,
  maxHp: 20,
  startingSanity: 10,
  maxSanity: 10,
  /** Limite D20 com especialidade = atributo + 10 */
  specialtyBase: 10,
  /** Com especialidade + bônus = atributo + 15 */
  bonusBase: 15,
  /** Com especialidade sob ônus = atributo + 8 */
  onusBase: 8,
  initiativeSpecialtyBonus: 2,
  initiativeOperativoBonus: 1,
  maxCooperationHelpers: 2,
  xpPerImprovement: 20,
  handsCapacity: 2,
  bagCapacity: 3,
  /** Psiquiatria: Médico não cai abaixo deste valor */
  psychiatryFloor: 5,
  /** Psiquiatria: só ajuda outros com Sanidade >= este valor */
  psychiatryHelpMinSanity: 8,
  vampireCritsToDestroy: { vampiro: 2, vampiro_mestre: 3 },
} as const;

export type BonusOnusConflictPolicy = 'onus_prevalece' | 'bonus_prevalece' | 'apenas_especialidade';
export type MinDamagePolicy = 0 | 1;

export interface ProvisionalRules {
  /** P-01 */ minDamage: MinDamagePolicy;
  /** P-02 */ bonusOnusConflict: BonusOnusConflictPolicy;
  /** P-03 */ initiativeMaxRerolls: number;
  /** P-04 */ initiativeSpecialties: string[];
  /** P-05 */ damageOverflowStopsAtZero: true;
  /** P-06 */ treatmentRequiresTest: boolean;
  /** P-06 */ treatmentAttribute: AttributeId;
  /** P-07 */ treatmentAtZeroHp: 'permitido_com_teste' | 'proibido';
  /** P-08 */ selfTreatmentForbidden: string[];
  /** P-09 */ firearmCritKillsHumanEnemies: boolean;
  /** P-09 */ firearmCritKillsProtagonists: boolean;
  /** P-10 */ vampireZeroHp: 'continua_ativo';
  /** P-11 */ defenseTestAttribute: AttributeId;
  /** P-12 */ coverTestAttribute: AttributeId;
  /** P-13 */ fleeSpecialty: string;
  /** P-14 */ cooperationResolution: 'melhor_resultado';
  /** P-15 */ teimosiaOnlyOnFailure: boolean;
  /** P-15 */ teimosiaAutoInCombat: boolean;
  /** P-16 */ progressionSpendingEnabled: boolean;
  /** P-17 */ pocketCapacity: number | null;
  /** P-18 */ focusCheckOnTests: boolean;
  /** P-19 */ psychiatryHelpRequiresTest: boolean;
  /** P-20 durações em minutos */
  durations: {
    examinar: number;
    investigar: number;
    dialogo: number;
    deslocamento: number;
    tratamento: number;
    esperar: number;
  };
  /** P-21 hora de início da primeira cena (minutos desde 00:00 do dia 1) */
  startMinute: number;
}

export const PROVISIONAL: ProvisionalRules = {
  minDamage: 0,
  bonusOnusConflict: 'onus_prevalece',
  initiativeMaxRerolls: 3,
  initiativeSpecialties: ['armas_curtas', 'armas_longas', 'combate_corpo_a_corpo', 'lideranca_tatica'],
  damageOverflowStopsAtZero: true,
  treatmentRequiresTest: true,
  treatmentAttribute: 'raciocinio',
  treatmentAtZeroHp: 'permitido_com_teste',
  selfTreatmentForbidden: ['cirurgia'],
  firearmCritKillsHumanEnemies: true,
  firearmCritKillsProtagonists: false,
  vampireZeroHp: 'continua_ativo',
  defenseTestAttribute: 'reflexo',
  coverTestAttribute: 'reflexo',
  fleeSpecialty: 'evasao',
  cooperationResolution: 'melhor_resultado',
  teimosiaOnlyOnFailure: true,
  teimosiaAutoInCombat: true,
  progressionSpendingEnabled: false,
  pocketCapacity: null,
  focusCheckOnTests: true,
  psychiatryHelpRequiresTest: false,
  durations: {
    examinar: 10,
    investigar: 20,
    dialogo: 15,
    deslocamento: 40,
    tratamento: 20,
    esperar: 60,
  },
  startMinute: 16 * 60 + 50,
};

/** Configuração ativa (pode ser sobrescrita em testes). */
export let rules: ProvisionalRules = { ...PROVISIONAL };

export function setProvisionalRules(patch: Partial<ProvisionalRules>): void {
  rules = { ...rules, ...patch };
}

export function resetProvisionalRules(): void {
  rules = { ...PROVISIONAL };
}
