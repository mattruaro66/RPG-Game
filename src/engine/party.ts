import { CANONICAL } from '../config/rules';
import { BONUS_BY_ID } from '../data/bonuses';
import { CHARACTER_BY_ID } from '../data/characters';
import { STARTING_EQUIPMENT } from '../data/items';
import { SPECIALTY_BY_ID } from '../data/specialties';
import { addItem, emptyInventory, makeUid } from './inventory';
import { ATTRIBUTE_IDS, type CharacterId, type CharacterState, type ControlMode } from './types';

export interface CharacterSelection {
  id: CharacterId;
  specialties: string[];
  bonuses: string[];
  control: ControlMode;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateSelection(sel: CharacterSelection[]): ValidationResult {
  const errors: string[] = [];
  if (sel.length !== CANONICAL.partySize) errors.push(`O grupo deve ter exatamente ${CANONICAL.partySize} personagens.`);
  const ids = new Set<string>();
  for (const s of sel) {
    const def = CHARACTER_BY_ID[s.id];
    if (!def) {
      errors.push(`Personagem desconhecido: ${s.id}`);
      continue;
    }
    if (ids.has(s.id)) errors.push(`${def.name} foi selecionado mais de uma vez.`);
    ids.add(s.id);
    const specs = new Set(s.specialties);
    if (specs.size !== s.specialties.length) errors.push(`${def.name}: especialidade repetida.`);
    if (s.specialties.length !== CANONICAL.specialtiesPerCharacter) errors.push(`${def.name}: escolha exatamente ${CANONICAL.specialtiesPerCharacter} especialidades.`);
    for (const sp of s.specialties) {
      const sd = SPECIALTY_BY_ID[sp];
      if (!sd) errors.push(`${def.name}: especialidade desconhecida (${sp}).`);
      else if (sd.profession !== def.profession) errors.push(`${def.name}: ${sd.name} não pertence à profissão inicial.`);
    }
    const bon = new Set(s.bonuses);
    if (bon.size !== s.bonuses.length) errors.push(`${def.name}: bônus repetido.`);
    if (s.bonuses.length !== CANONICAL.bonusesPerCharacter) errors.push(`${def.name}: escolha exatamente ${CANONICAL.bonusesPerCharacter} bônus.`);
    for (const b of s.bonuses) if (!BONUS_BY_ID[b]) errors.push(`${def.name}: bônus desconhecido (${b}).`);
  }
  return { ok: errors.length === 0, errors };
}

export function validateAttributeTable(): ValidationResult {
  const errors: string[] = [];
  for (const def of Object.values(CHARACTER_BY_ID)) {
    const sum = ATTRIBUTE_IDS.reduce((a, k) => a + def.attributes[k], 0);
    if (sum !== CANONICAL.attributePointsPerCharacter) errors.push(`${def.name}: ${sum} pontos (esperado 13).`);
    for (const k of ATTRIBUTE_IDS) {
      const v = def.attributes[k];
      if (v < CANONICAL.attributeMin || v > CANONICAL.attributeMax) errors.push(`${def.name}: ${k} fora da escala.`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function createCharacter(sel: CharacterSelection): CharacterState {
  const def = CHARACTER_BY_ID[sel.id];
  let inventory = emptyInventory();
  for (const eq of STARTING_EQUIPMENT[sel.id] ?? []) {
    const r = addItem(inventory, { uid: makeUid(), itemId: eq.itemId }, eq.location);
    if (r.ok) inventory = r.inventory;
  }
  return {
    id: def.id,
    name: def.name,
    profession: def.profession,
    attributes: { ...def.attributes },
    specialties: [...sel.specialties],
    bonuses: [...sel.bonuses],
    hp: CANONICAL.maxHp,
    maxHp: CANONICAL.maxHp,
    status: 'ativo',
    sanity: CANONICAL.startingSanity,
    xp: 0,
    improvementsSpent: 0,
    inventory,
    control: sel.control,
    lastSanityRecoveryDay: null,
    lastPsychiatryGivenDay: null,
    history: [],
  };
}

export function createParty(sel: CharacterSelection[]): CharacterState[] {
  const v = validateSelection(sel);
  if (!v.ok) throw new Error(v.errors.join(' '));
  return sel.map(createCharacter);
}
