import { applyDamage, applyLethalityRules, rollDamage } from '../engine/damage';
import { fixedDice } from '../engine/dice/dice';
import { resetProvisionalRules, setProvisionalRules } from '../config/rules';
import { makeChar } from './helpers';

afterEach(() => resetProvisionalRules());

describe('Dano', () => {
  it('dano crítico dobra o total (1D6+2 com 6 → 16)', () => {
    const d = rollDamage(fixedDice({ d6: [6] }), 'arma_de_fogo', true);
    expect(d.base).toBe(8);
    expect(d.total).toBe(16);
  });

  it('dano normal de arma de fogo', () => {
    expect(rollDamage(fixedDice({ d6: [3] }), 'arma_de_fogo', false).total).toBe(5);
  });

  it('ataques vampíricos usam 2D6', () => {
    expect(rollDamage(fixedDice({ d6: [3, 4] }), 'vampirico_excepcional', false).total).toBe(9);
  });

  it('política de dano mínimo é configurável', () => {
    expect(rollDamage(fixedDice({ d6: [1] }), 'desarmado', false).total).toBe(0);
    setProvisionalRules({ minDamage: 1 });
    expect(rollDamage(fixedDice({ d6: [1] }), 'desarmado', false).total).toBe(1);
  });
});

describe('Pontos de Vida', () => {
  it('protagonistas começam com 20 PV', () => {
    expect(makeChar('jack').hp).toBe(20);
  });

  it('PV 0 → Às Portas da Morte', () => {
    const r = applyDamage(makeChar('jack', {}, { hp: 5 }), 7);
    expect(r.target.hp).toBe(0);
    expect(r.target.status).toBe('portas_da_morte');
  });

  it('personagem com 0 PV morre ao receber novo dano', () => {
    const c = makeChar('jack', {}, { hp: 0, status: 'portas_da_morte' });
    const r = applyDamage(c, 1);
    expect(r.target.status).toBe('morto');
    expect(r.outcome.died).toBe(true);
  });
});

describe('Letalidade sobrenatural', () => {
  it('crítico com arma de fogo mata humano ou ghoul (inimigos)', () => {
    expect(applyLethalityRules({ kind: 'humano', criticalHits: 0, firearm: true, critical: true, isProtagonist: false }).killed).toBe(true);
    expect(applyLethalityRules({ kind: 'ghoul', criticalHits: 0, firearm: true, critical: true, isProtagonist: false }).killed).toBe(true);
  });

  it('balas comuns sem crítico não matam vampiros', () => {
    const r = applyLethalityRules({ kind: 'vampiro', criticalHits: 0, firearm: true, critical: false, isProtagonist: false });
    expect(r.destroyed).toBe(false);
  });

  it('dois críticos destroem vampiro comum; três, vampiro-mestre', () => {
    let r = applyLethalityRules({ kind: 'vampiro', criticalHits: 0, firearm: true, critical: true, isProtagonist: false });
    expect(r.destroyed).toBe(false);
    r = applyLethalityRules({ kind: 'vampiro', criticalHits: r.criticalHits, firearm: true, critical: true, isProtagonist: false });
    expect(r.destroyed).toBe(true);
    let m = applyLethalityRules({ kind: 'vampiro_mestre', criticalHits: 1, firearm: true, critical: true, isProtagonist: false });
    expect(m.destroyed).toBe(false);
    m = applyLethalityRules({ kind: 'vampiro_mestre', criticalHits: m.criticalHits, firearm: true, critical: true, isProtagonist: false });
    expect(m.destroyed).toBe(true);
  });
});
