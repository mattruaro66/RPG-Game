import { actionTest, canReroll, computeLimit, rerollActionTest, simpleTest } from '../engine/checks';
import { createRng, diceFromRng, fixedDice } from '../engine/dice/dice';

const limit = (attributeValue: number, hasSpecialty: boolean, bonusIds: string[] = [], tags: Parameters<typeof computeLimit>[0]['tags'] = []) =>
  computeLimit({ attribute: 'raciocinio', attributeValue, specialtyId: 'deducao', hasSpecialty, bonusIds, tags });

describe('D6 — teste simples', () => {
  it('sucesso quando o resultado é igual ou inferior ao atributo', () => {
    for (const roll of [1, 2, 3, 4]) {
      expect(simpleTest(fixedDice({ d6: [roll] }), { label: 't', attribute: 'espirito', value: 4 }).success).toBe(true);
    }
    expect(simpleTest(fixedDice({ d6: [5] }), { label: 't', attribute: 'espirito', value: 4 }).success).toBe(false);
  });

  it('6 natural sempre falha, mesmo com atributo efetivo 6', () => {
    const r = simpleTest(fixedDice({ d6: [6] }), { label: 't', attribute: 'fisico', value: 5, traitModifier: 1 });
    expect(r.success).toBe(false);
    expect(r.autoFail).toBe(true);
  });

  it('atributo 0 impede a ação sem rolar', () => {
    const d = fixedDice({ d6: [] });
    const r = simpleTest(d, { label: 't', attribute: 'raciocinio', value: 0 });
    expect(r.impossible).toBe(true);
    expect(r.roll).toBeNull();
  });
});

describe('D20 — teste de ação', () => {
  it('fórmulas de limite: atributo / +10 / +15 / +8', () => {
    expect(limit(4, false).limit).toBe(4);
    expect(limit(4, true).limit).toBe(14);
    expect(limit(4, true, ['olho_clinico'], ['perceber_detalhes']).limit).toBe(19);
    expect(limit(2, true, ['presenca_marcante'], ['passar_despercebido']).limit).toBe(10);
  });

  it('exemplo da especificação: Raciocínio 4 + Dedução = 14', () => {
    const b = limit(4, true);
    expect(actionTest(fixedDice({ d20: [2] }), 'Dedução', b).success).toBe(true);
    expect(actionTest(fixedDice({ d20: [14] }), 'Dedução', b).success).toBe(true);
    expect(actionTest(fixedDice({ d20: [15] }), 'Dedução', b).success).toBe(false);
  });

  it('1 natural sempre falha', () => {
    const r = actionTest(fixedDice({ d20: [1] }), 'x', limit(5, true, ['olho_clinico'], ['perceber_detalhes']));
    expect(r.success).toBe(false);
    expect(r.autoFail).toBe(true);
    expect(r.critical).toBe(false);
  });

  it('crítico: resultado igual ao limite, com especialidade', () => {
    const r = actionTest(fixedDice({ d20: [14] }), 'x', limit(4, true));
    expect(r.critical).toBe(true);
  });

  it('crítico exige a especialidade', () => {
    const r = actionTest(fixedDice({ d20: [4] }), 'x', limit(4, false));
    expect(r.success).toBe(true);
    expect(r.critical).toBe(false);
  });

  it('atributo 0 impede a ação', () => {
    const r = actionTest(fixedDice({ d20: [] }), 'x', limit(0, true));
    expect(r.impossible).toBe(true);
  });

  it('Teimosia Inabalável: uma repetição, segundo resultado obrigatório', () => {
    const d = fixedDice({ d20: [18, 20] });
    const first = actionTest(d, 'x', limit(4, true));
    expect(canReroll(first, ['teimosia_inabalavel'])).toBe(true);
    expect(canReroll(first, ['olho_clinico'])).toBe(false);
    const second = rerollActionTest(d, first);
    expect(second.rolls).toEqual([18, 20]);
    expect(second.success).toBe(false);
    expect(canReroll(second, ['teimosia_inabalavel'])).toBe(false);
    expect(() => rerollActionTest(d, second)).toThrow();
  });
});

describe('RNG serializável', () => {
  it('mesma semente gera a mesma sequência', () => {
    const a = diceFromRng(createRng(42));
    const b = diceFromRng(createRng(42));
    const sa = Array.from({ length: 20 }, () => a.d20());
    const sb = Array.from({ length: 20 }, () => b.d20());
    expect(sa).toEqual(sb);
    expect(sa.every((v) => v >= 1 && v <= 20)).toBe(true);
  });
});
