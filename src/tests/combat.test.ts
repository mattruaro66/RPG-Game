import { CAMPAIGN } from '../data/campaign';
import { currentActorId, eligibleHelpers, performAttack, performCombatAction, resolveCooperationReflex, startCombat } from '../engine/combat/combat';
import { moveToEndOfQueue, rollInitiative } from '../engine/combat/initiative';
import { fixedDice } from '../engine/dice/dice';
import type { GameState } from '../engine/state';
import { newGame } from '../state/session';
import { partySelection } from './helpers';

describe('Iniciativa', () => {
  it('D6 + 2 (especialidade) + 1 (Operativo), acumuláveis', () => {
    const r = rollInitiative(fixedDice({ d6: [3, 3] }), [
      { id: 'op', relevantSpecialty: true, operativo: true },
      { id: 'x', relevantSpecialty: false, operativo: false },
    ]);
    expect(r[0]).toMatchObject({ id: 'op', total: 6 });
    expect(r[1]).toMatchObject({ id: 'x', total: 3 });
  });

  it('empates são resolvidos com nova rolagem', () => {
    const r = rollInitiative(fixedDice({ d6: [4, 4, 2, 5] }), [
      { id: 'a', relevantSpecialty: false, operativo: false },
      { id: 'b', relevantSpecialty: false, operativo: false },
    ]);
    expect(r.map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('empates persistentes mantêm a ordem de entrada (decisão do narrador)', () => {
    const r = rollInitiative(fixedDice({ d6: [4, 4, 3, 3, 3, 3, 3, 3] }), [
      { id: 'a', relevantSpecialty: false, operativo: false },
      { id: 'b', relevantSpecialty: false, operativo: false },
    ]);
    expect(r.map((e) => e.id)).toEqual(['a', 'b']);
  });
});

describe('Cooperação', () => {
  it('cooperação malsucedida move o ajudante para o fim e preserva a ordem dos demais', () => {
    expect(moveToEndOfQueue(['a', 'b', 'c', 'd', 'e'], 'b')).toEqual(['a', 'c', 'd', 'e', 'b']);
  });

  function combatState(): GameState {
    const s = newGame(partySelection(['jack', 'daniel', 'mick', 'ray']), 1);
    s.present = s.party.map((c) => c.id);
    // Ordem: jack, inimigo 1, mick, ray, daniel, inimigo 2 (iniciativa forçada)
    startCombat(s, fixedDice({ d6: [6, 1, 3, 4, 5, 2, ...Array.from({ length: 40 }, (_, i) => (i % 6) + 1)] }), CAMPAIGN.encounters.invasores);
    // Ordem determinística para o teste: protagonistas primeiro, depois inimigos.
    const enemies = Object.keys(s.combat!.enemies);
    s.combat!.order = ['jack', 'mick', 'ray', 'daniel', ...enemies];
    s.combat!.turnIndex = 0;
    return s;
  }

  it('ajudante que falha no D6 de Reflexo vai para o final da fila', () => {
    const s = combatState();
    const order = [...s.combat!.order];
    expect(currentActorId(s)).toBe(order[0]);
    const actor = order[0];
    const helper = eligibleHelpers(s, actor)[0];
    resolveCooperationReflex(s, fixedDice({ d6: [6] }), [helper], actor);
    const expected = [...order.filter((x) => x !== helper), helper];
    expect(s.combat!.order).toEqual(expected);
    expect(currentActorId(s)).toBe(actor);
  });

  it('ajudante que passa no D6 mantém seu turno original', () => {
    const s = combatState();
    const order = [...s.combat!.order];
    const actor = order[0];
    const helper = eligibleHelpers(s, actor)[0];
    const r = resolveCooperationReflex(s, fixedDice({ d6: [1] }), [helper], actor);
    expect(r[0].joined).toBe(true);
    expect(s.combat!.order).toEqual(order);
  });

  it('no máximo dois ajudantes', () => {
    const s = combatState();
    const actor = s.combat!.order[0];
    const helpers = eligibleHelpers(s, actor);
    expect(helpers.length).toBeGreaterThanOrEqual(3);
    const r = resolveCooperationReflex(s, fixedDice({ d6: [1, 1, 1] }), helpers, actor);
    expect(r).toHaveLength(2);
  });
});

describe('Ações de combate', () => {
  it('ataque com arma de fogo aplica dano e o turno avança', () => {
    const s = newGame(partySelection(['jack', 'daniel', 'mick', 'ray']), 2);
    s.present = s.party.map((c) => c.id);
    startCombat(s, fixedDice({ d6: [1, 1, 6, 1, 1, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1] }), CAMPAIGN.encounters.invasores);
    const actor = currentActorId(s)!;
    expect(actor).toBe('mick');
    const mick = s.party.find((c) => c.id === 'mick')!;
    const gun = mick.inventory.hands[0].uid;
    const enemy = Object.keys(s.combat!.enemies)[0];
    // Reflexo 4 + Armas Curtas = 14; D20 10 acerta; dano 1D6+2 com 3 = 5
    performCombatAction(s, fixedDice({ d20: [10], d6: [3] }), { type: 'atacar', targetId: enemy, weaponUid: gun });
    expect(s.combat!.enemies[enemy].hp).toBe(5);
    expect(currentActorId(s)).not.toBe('mick');
  });

  it('crítico com arma de fogo mata um criminoso humano', () => {
    const s = newGame(partySelection(['jack', 'daniel', 'mick', 'ray']), 3);
    s.present = s.party.map((c) => c.id);
    startCombat(s, fixedDice({ d6: [1, 1, 6, 1, 1, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1] }), CAMPAIGN.encounters.invasores);
    const mick = s.party.find((c) => c.id === 'mick')!;
    const enemy = Object.keys(s.combat!.enemies)[0];
    const r = performAttack(s, fixedDice({ d20: [14], d6: [1] }), 'mick', enemy, mick.inventory.hands[0].uid);
    expect(r.critical).toBe(true);
    expect(s.combat!.enemies[enemy].status).toBe('morto');
  });

  it('cobertura é testada antes da esquiva', () => {
    const s = newGame(partySelection(['jack', 'daniel', 'mick', 'ray']), 4);
    s.present = s.party.map((c) => c.id);
    startCombat(s, fixedDice({ d6: [1, 1, 6, 1, 1, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1] }), CAMPAIGN.encounters.invasores);
    const enemy = Object.values(s.combat!.enemies).find((e) => e.weaponItemId === 'revolver_38')!;
    s.combat!.combatants.jack.inCover = true;
    s.combat!.combatants.jack.defending = true;
    // Ataque acerta (D20 5); cobertura D6 1 → bloqueia; esquiva não chega a ser rolada.
    const d = fixedDice({ d20: [5], d6: [1] });
    const r = performAttack(s, d, enemy.uid, 'jack', null);
    expect(r.blockedBy).toBe('cobertura');
    expect(d.remaining().d6).toBe(0);
  });
});
