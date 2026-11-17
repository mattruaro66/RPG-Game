import { resolveBonuses } from '../engine/bonuses';
import { BONUSES } from '../data/bonuses';
import { resetProvisionalRules, setProvisionalRules } from '../config/rules';

afterEach(() => resetProvisionalRules());

describe('Bônus e ônus', () => {
  it('existem exatamente 20 bônus', () => {
    expect(BONUSES).toHaveLength(20);
    expect(new Set(BONUSES.map((b) => b.number)).size).toBe(20);
  });

  it('não se aplicam sem a especialidade correspondente', () => {
    const r = resolveBonuses(['olho_clinico'], ['perceber_detalhes'], false);
    expect(r.kind).toBe('nenhum');
  });

  it('bônus social não se aplica a toda conversa: exige a condição', () => {
    expect(resolveBonuses(['labia'], ['interpretar_pessoas'], true).kind).toBe('especialidade');
    expect(resolveBonuses(['labia'], ['persuasao'], true).kind).toBe('bonus');
  });

  it('bônus não acumulam: dois bônus aplicáveis ainda dão +15', () => {
    const r = resolveBonuses(['olho_clinico', 'foco_absoluto'], ['perceber_detalhes', 'concentracao'], true);
    expect(r.kind).toBe('bonus');
  });

  it('ônus não acumulam: dois ônus ainda dão +8', () => {
    const r = resolveBonuses(['presenca_marcante', 'instinto_de_perigo'], ['passar_despercebido', 'ambiente_com_estranhos'], true);
    expect(r.kind).toBe('onus');
  });

  it('Presença Marcante: ao passar despercebido perde o +5 e usa +8', () => {
    const r = resolveBonuses(['presenca_marcante'], ['passar_despercebido', 'autoridade'], true);
    expect(r.kind).toBe('onus');
  });

  it('Instinto de Perigo: ônus não se aplica ao combate', () => {
    expect(resolveBonuses(['instinto_de_perigo'], ['ambiente_com_estranhos'], true).kind).toBe('onus');
    expect(resolveBonuses(['instinto_de_perigo'], ['ambiente_com_estranhos', 'combate'], true).kind).toBe('especialidade');
  });

  it('Sobrevivente: bônus em perigo real, ônus fora dele', () => {
    expect(resolveBonuses(['sobrevivente'], ['superar_adversidade', 'perigo_real'], true).kind).toBe('bonus');
    expect(resolveBonuses(['sobrevivente'], ['superar_adversidade'], true).kind).toBe('onus');
    expect(resolveBonuses(['sobrevivente'], ['persuasao'], true).kind).toBe('especialidade');
  });

  it('Leitor de Pessoas: ônus quando emocionalmente envolvido', () => {
    expect(resolveBonuses(['leitor_de_pessoas'], ['interpretar_pessoas', 'envolvimento_emocional'], true).kind).toBe('onus');
  });

  it('Mente Estratégica: paranoia ativa o ônus em planejamento', () => {
    expect(resolveBonuses(['mente_estrategica'], ['planejamento', 'paranoia'], true).kind).toBe('onus');
    expect(resolveBonuses(['mente_estrategica'], ['planejamento'], true).kind).toBe('bonus');
  });

  it('conflito entre bônus e ônus segue a política provisória configurável', () => {
    const tags = ['perceber_detalhes', 'passar_despercebido'] as const;
    expect(resolveBonuses(['olho_clinico', 'presenca_marcante'], [...tags], true).kind).toBe('onus');
    setProvisionalRules({ bonusOnusConflict: 'bonus_prevalece' });
    expect(resolveBonuses(['olho_clinico', 'presenca_marcante'], [...tags], true).kind).toBe('bonus');
    setProvisionalRules({ bonusOnusConflict: 'apenas_especialidade' });
    expect(resolveBonuses(['olho_clinico', 'presenca_marcante'], [...tags], true).kind).toBe('especialidade');
  });
});
