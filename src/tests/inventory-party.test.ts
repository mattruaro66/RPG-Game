import { addItem, autoPlace, canPlace, emptyInventory, moveItem } from '../engine/inventory';
import { createParty, validateAttributeTable, validateSelection } from '../engine/party';
import { CHARACTERS } from '../data/characters';
import { SPECIALTIES, specialtiesOf } from '../data/specialties';
import { DEFAULT_SELECTION, partySelection } from './helpers';

describe('Inventário', () => {
  it('mãos comportam 2 espaços e a bolsa 3', () => {
    let inv = emptyInventory();
    inv = addItem(inv, { uid: 'a', itemId: 'lanterna' }, 'hands').inventory;
    inv = addItem(inv, { uid: 'b', itemId: 'revolver_38' }, 'hands').inventory;
    expect(addItem(inv, { uid: 'c', itemId: 'faca' }, 'hands').ok).toBe(false);
    for (const uid of ['d', 'e', 'f']) inv = addItem(inv, { uid, itemId: 'camera' }, 'bag').inventory;
    expect(addItem(inv, { uid: 'g', itemId: 'gravador' }, 'bag').ok).toBe(false);
  });

  it('itens de 2 espaços ocupam as duas mãos', () => {
    let inv = addItem(emptyInventory(), { uid: 'a', itemId: 'espingarda' }, 'hands').inventory;
    expect(addItem(inv, { uid: 'b', itemId: 'lanterna' }, 'hands').ok).toBe(false);
    inv = emptyInventory();
    expect(canPlace(inv, 'espingarda', 'pockets').ok).toBe(false);
  });

  it('munição, kits médicos e objetos grandes não vão nos bolsos', () => {
    const inv = emptyInventory();
    expect(canPlace(inv, 'municao_38', 'pockets').ok).toBe(false);
    expect(canPlace(inv, 'kit_medico', 'pockets').ok).toBe(false);
    expect(canPlace(inv, 'pe_de_cabra', 'pockets').ok).toBe(false);
    expect(canPlace(inv, 'carteira', 'pockets').ok).toBe(true);
  });

  it('não ultrapassa a capacidade ao mover', () => {
    let inv = emptyInventory();
    inv = addItem(inv, { uid: 'a', itemId: 'lanterna' }, 'hands').inventory;
    inv = addItem(inv, { uid: 'b', itemId: 'faca' }, 'hands').inventory;
    inv = addItem(inv, { uid: 'c', itemId: 'camera' }, 'bag').inventory;
    const r = moveItem(inv, 'c', 'hands');
    expect(r.ok).toBe(false);
    expect(r.inventory.bag).toHaveLength(1);
  });

  it('autoPlace recusa quando tudo está cheio', () => {
    let inv = emptyInventory();
    for (const uid of ['a', 'b']) inv = addItem(inv, { uid, itemId: 'lanterna' }, 'hands').inventory;
    for (const uid of ['c', 'd', 'e']) inv = addItem(inv, { uid, itemId: 'lanterna' }, 'bag').inventory;
    expect(autoPlace(inv, { uid: 'z', itemId: 'camera' }).ok).toBe(false);
  });
});

describe('Personagens e formação do grupo', () => {
  it('tabela de atributos: 13 pontos, escala 0–5', () => {
    expect(validateAttributeTable().ok).toBe(true);
    expect(CHARACTERS).toHaveLength(6);
  });

  it('8 especialidades por profissão (48 no total)', () => {
    expect(SPECIALTIES).toHaveLength(48);
    for (const p of ['investigador', 'medico', 'operativo', 'jornalista', 'ocultista', 'infiltrador'] as const) {
      expect(specialtiesOf(p)).toHaveLength(8);
    }
  });

  it('quatro personagens podem compor o grupo', () => {
    const party = createParty(partySelection(['jack', 'daniel', 'mick', 'liz']));
    expect(party).toHaveLength(4);
    expect(party.every((c) => c.hp === 20 && c.sanity === 10)).toBe(true);
  });

  it('personagens não podem ser selecionados duas vezes', () => {
    const v = validateSelection([DEFAULT_SELECTION.jack, DEFAULT_SELECTION.jack, DEFAULT_SELECTION.liz, DEFAULT_SELECTION.ray]);
    expect(v.ok).toBe(false);
  });

  it('exige exatamente 4 personagens, 3 especialidades e 2 bônus', () => {
    expect(validateSelection(partySelection(['jack', 'liz', 'ray'])).ok).toBe(false);
    expect(validateSelection([{ ...DEFAULT_SELECTION.jack, specialties: ['deducao'] }, DEFAULT_SELECTION.liz, DEFAULT_SELECTION.ray, DEFAULT_SELECTION.mick]).ok).toBe(false);
    expect(validateSelection([{ ...DEFAULT_SELECTION.jack, bonuses: ['labia'] }, DEFAULT_SELECTION.liz, DEFAULT_SELECTION.ray, DEFAULT_SELECTION.mick]).ok).toBe(false);
  });

  it('especialidades iniciais devem ser da própria profissão', () => {
    const bad = { ...DEFAULT_SELECTION.jack, specialties: ['deducao', 'interrogatorio', 'cirurgia'] };
    expect(validateSelection([bad, DEFAULT_SELECTION.liz, DEFAULT_SELECTION.ray, DEFAULT_SELECTION.mick]).ok).toBe(false);
  });
});
