import { validate, buildPrompt, SAFE_FALLBACK } from '../ai/interpreter';
import { activeParty } from '../engine/narrative/conditions';
import { visibleInteractions } from '../engine/narrative/scene';
import { chooseOption, freeText, interact, newGame } from '../state/session';
import { meetAndDecide, partySelection } from './helpers';

const start = (seed = 31) => newGame(partySelection(['jack', 'daniel', 'mick', 'liz']), seed);
const meetVictoria = (seed = 31) => interact(start(seed), 'esperar_cliente');

describe('Presença do grupo', () => {
  it('no início só o contato está no escritório', () => {
    const s = start();
    expect(activeParty(s).map((c) => c.id)).toEqual(['jack']);
    expect(s.narrative.some((e) => e.text.includes('Mick Donovan'))).toBe(false);
  });

  it('só dá para telefonar depois que a cliente sai, e só para quem alguém presente conhece', () => {
    let s = start();
    expect(visibleInteractions(s).some((i) => i.id.startsWith('ligar_'))).toBe(false);
    s = meetAndDecide(s, true);
    expect(s.sceneId).toBe('escritorio_noite');
    // Jack conhece Liz (e Ray, fora do grupo). Mick e Daniel não são conhecidos de Jack.
    expect(visibleInteractions(s).filter((i) => i.id.startsWith('ligar_')).map((i) => i.id)).toEqual(['ligar_liz']);
  });

  it('a ligação é curta e não despeja a história de quem é chamado', () => {
    let s = meetAndDecide(start(), true);
    s = interact(s, 'ligar_liz');
    expect(activeParty(s).map((c) => c.id)).toEqual(['jack', 'liz']);
    const call = s.narrative.slice(-6).map((e) => e.text).join(' ');
    expect(call).not.toMatch(/corpos|funerária|perfura|prontuário/i);
  });

  it('ausentes não aparecem como opção de teste nem entram em combate', () => {
    const s = start();
    expect(activeParty(s).some((c) => c.id === 'mick')).toBe(false);
  });
});

describe('Victoria', () => {
  it('chega sem dizer o nome e é tratada como “a mulher de vermelho”', () => {
    const s = meetVictoria();
    expect(s.narrative.some((e) => e.speaker === 'A mulher de vermelho')).toBe(true);
    expect(s.narrative.some((e) => e.text.includes('Meu nome é Victoria'))).toBe(false);
    expect(s.journal.people).not.toContain('victoria');
  });

  it('“(Continuar)” não reapresenta a cliente', () => {
    let s = meetVictoria();
    s = chooseOption(s, 'quem');
    s = chooseOption(s, 'voltar');
    s = chooseOption(s, 'morto');
    s = chooseOption(s, 'voltar');
    const arrivals = s.narrative.filter((e) => e.text.startsWith('A mulher que entra')).length;
    const asks = s.narrative.filter((e) => e.text === '— Preciso que encontre um homem.').length;
    expect(arrivals).toBe(1);
    expect(asks).toBe(1);
  });

  it('perguntar o nome a apresenta', () => {
    let s = meetVictoria();
    s = chooseOption(s, 'nome');
    expect(s.journal.people).toContain('victoria');
    s = chooseOption(s, 'voltar');
    s = chooseOption(s, 'quem');
    expect([...s.narrative].reverse().find((e) => e.kind === 'fala' && e.speaker !== 'Jack')?.speaker).toBe('Victoria Whitmore');
  });

  it('o prompt do narrador não revela o nome antes da apresentação', () => {
    let s = meetVictoria();
    s = chooseOption(s, 'quem');
    expect(buildPrompt(s, 'Ela parece nervosa?', 'jack')).not.toContain('Victoria');
  });
});

describe('Improviso do narrador', () => {
  it('fala de NPC improvisada entra com o nome conhecido; NPC ausente vira narrador', () => {
    const s = meetVictoria();
    const r = validate(s, { acao: null, falas: [{ quem: 'victoria', texto: '— Não vim aqui falar de mim.' }, { quem: 'sal', texto: 'Oi' }], minutos: 3 }, 'Onde a senhora mora?');
    expect(r.lines[0]).toEqual({ who: 'victoria', text: '— Não vim aqui falar de mim.' });
    expect(r.lines[1].who).toBe('narrador');
    const after = freeText(s, 'Onde a senhora mora?', r, 'jack');
    expect(after.narrative.some((e) => e.speaker === 'A mulher de vermelho' && e.text.includes('falar de mim'))).toBe(true);
    expect(after.journal.clues).toEqual(s.journal.clues);
  });

  it('teste improvisado é rolado pelo motor e mostra sucesso ou falha', () => {
    const s = start();
    const r = validate(s, { acao: null, falas: [], teste: { atributo: 'fisico', especialidade: null, motivo: 'Forçar a janela emperrada', sucesso: 'A janela cede.', falha: 'A janela não se mexe.' }, minutos: 5 }, 'forço a janela');
    expect(r.test?.attribute).toBe('fisico');
    const after = freeText(s, 'forço a janela', r, 'jack');
    expect(after.diceLog.length).toBe(s.diceLog.length + 1);
    expect(after.narrative.some((e) => e.text === 'A janela cede.' || e.text === 'A janela não se mexe.')).toBe(true);
  });

  it('atributo ou especialidade inválidos não geram teste', () => {
    const r = validate(start(), { acao: null, falas: [], teste: { atributo: 'magia', sucesso: 'x', falha: 'y' } }, 'lanço um feitiço');
    expect(r.test).toBeNull();
    expect(r.lines[0].text).toBe(SAFE_FALLBACK);
  });

  it('termos da conspiração ainda não descobertos derrubam o improviso', () => {
    const s = meetVictoria();
    const r = validate(s, { acao: null, falas: [{ quem: 'victoria', texto: 'Thomas foi levado pelos vampiros da Camarilla.' }] }, 'o que houve?');
    expect(r.lines).toEqual([{ who: 'narrador', text: SAFE_FALLBACK }]);
  });

  it('confiança só muda ±1 e só para NPC presente', () => {
    const s = meetVictoria();
    expect(validate(s, { falas: [{ quem: 'narrador', texto: 'Ela sorri.' }], confianca: { npc: 'victoria', delta: 1 } }, 'elogio').trust).toEqual({ npc: 'victoria', delta: 1 });
    expect(validate(s, { falas: [{ quem: 'narrador', texto: 'x' }], confianca: { npc: 'sal', delta: 1 } }, 'x').trust).toBeNull();
    expect(validate(s, { falas: [{ quem: 'narrador', texto: 'x' }], confianca: { npc: 'victoria', delta: 5 } }, 'x').trust).toBeNull();
  });
});
