import { fixedDice } from '../engine/dice/dice';
import { treat } from '../engine/medical';
import { applyHorrorEvent, dailySanityRecovery, loseSanity, psychiatricHelp, sanityState } from '../engine/sanity';
import { makeChar } from './helpers';

describe('Sanidade', () => {
  it('estados por faixa', () => {
    expect(sanityState(10)).toBe('sao');
    expect(sanityState(7)).toBe('paranoia');
    expect(sanityState(4)).toBe('comprometimento');
    expect(sanityState(1)).toBe('beira_colapso');
    expect(sanityState(0)).toBe('loucura');
  });

  it('Sanidade 0 é irreversível', () => {
    const c = makeChar('liz', {}, { sanity: 0 });
    const r = dailySanityRecovery(fixedDice({ d6: [1] }), c, 0);
    expect(r.character.sanity).toBe(0);
    expect(r.test).toBeNull();
  });

  it('recuperação diária: uma tentativa por dia', () => {
    const c = makeChar('liz', {}, { sanity: 6 });
    const r1 = dailySanityRecovery(fixedDice({ d6: [1] }), c, 0);
    expect(r1.character.sanity).toBe(7);
    const r2 = dailySanityRecovery(fixedDice({ d6: [1] }), r1.character, 0);
    expect(r2.test).toBeNull();
    const r3 = dailySanityRecovery(fixedDice({ d6: [1] }), r1.character, 1);
    expect(r3.character.sanity).toBe(8);
  });

  it('Psiquiatria impede Sanidade inferior a 5 no Médico', () => {
    const d = makeChar('daniel', {}, { sanity: 6 });
    expect(loseSanity(d, 4).after).toBe(5);
    const liz = makeChar('liz', {}, { sanity: 6 });
    expect(loseSanity(liz, 4).after).toBe(2);
  });

  it('Médico sem Psiquiatria não tem a proteção', () => {
    const d = makeChar('daniel', { specialties: ['primeiros_socorros', 'cirurgia', 'anatomia'] }, { sanity: 6 });
    expect(loseSanity(d, 4).after).toBe(2);
  });

  it('Psiquiatria: ajuda outro só com Sanidade 8–10, uma vez por dia', () => {
    const doc = makeChar('daniel', {}, { sanity: 8 });
    const liz = makeChar('liz', {}, { sanity: 5 });
    const r = psychiatricHelp(doc, liz, 0);
    expect(r.ok).toBe(true);
    expect(r.target.sanity).toBe(6);
    expect(psychiatricHelp(r.doctor, r.target, 0).ok).toBe(false);
    expect(psychiatricHelp(makeChar('daniel', {}, { sanity: 7 }), liz, 0).ok).toBe(false);
  });

  it('eventos de horror: evidência estranha sem perda; horror humano com teste; sobrenatural automático', () => {
    const c = makeChar('jack');
    expect(applyHorrorEvent(fixedDice({}), c, 'evidencia_estranha').change.after).toBe(10);
    expect(applyHorrorEvent(fixedDice({ d6: [1] }), c, 'horror_humano').change.after).toBe(10);
    expect(applyHorrorEvent(fixedDice({ d6: [5] }), c, 'horror_humano').change.after).toBe(9);
    expect(applyHorrorEvent(fixedDice({}), c, 'manifestacao_sobrenatural').change.after).toBe(9);
  });
});

describe('Sistema médico', () => {
  it('Primeiros Socorros recupera 1D6+1, respeitando 20 PV', () => {
    const doc = makeChar('daniel');
    const jack = makeChar('jack', {}, { hp: 10 });
    const r = treat(fixedDice({ d20: [5], d6: [4] }), doc, jack, 'primeiros_socorros');
    expect(r.healed).toBe(5);
    const r2 = treat(fixedDice({ d20: [5], d6: [6] }), doc, makeChar('jack', {}, { hp: 18 }), 'primeiros_socorros');
    expect(r2.target.hp).toBe(20);
  });

  it('Farmacologia recupera 1D6−1', () => {
    const doc = makeChar('daniel', { specialties: ['farmacologia', 'cirurgia', 'psiquiatria'] });
    const r = treat(fixedDice({ d20: [5], d6: [4] }), doc, makeChar('jack', {}, { hp: 10 }), 'farmacologia');
    expect(r.healed).toBe(3);
  });

  it('Medicina Legal não recupera PV', () => {
    const doc = makeChar('daniel', { specialties: ['medicina_legal', 'cirurgia', 'psiquiatria'] });
    expect(treat(fixedDice({}), doc, makeChar('jack', {}, { hp: 10 }), 'medicina_legal').ok).toBe(false);
  });

  it('Médico não realiza Cirurgia em si mesmo, mas pode tratar a si', () => {
    const doc = makeChar('daniel', {}, { hp: 10 });
    expect(treat(fixedDice({}), doc, doc, 'cirurgia').ok).toBe(false);
    const r = treat(fixedDice({ d20: [5], d6: [2] }), doc, doc, 'primeiros_socorros');
    expect(r.healed).toBe(3);
    expect(r.healer.hp).toBe(13);
  });
});
