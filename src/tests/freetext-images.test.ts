import { CAMPAIGN } from '../data/campaign';
import { CONSPIRACY_OVERVIEW, INTERNAL_NPCS } from '../data/campaign/internal';
import { IMAGE_BY_ID, IMAGE_SLOTS } from '../data/images';
import { CHARACTERS } from '../data/characters';
import { buildPrompt, interpret, localInterpret, validate } from '../ai/interpreter';
import { entriesToLines, DEFAULT_VOICES } from '../platform/voice';
import { chooseOption, freeText, interact, newGame } from '../state/session';
import { partySelection } from './helpers';

const start = (seed = 21) => newGame(partySelection(['jack', 'daniel', 'mick', 'liz']), seed);

describe('Resposta livre', () => {
  it('o interpretador local encontra a ação pelas palavras', () => {
    const s = start();
    expect(localInterpret(s, 'Quero examinar o jornal que está na mesa').actionId).toBe('jornal');
    expect(localInterpret(s, 'Abro a gaveta da escrivaninha').actionId).toBe('gaveta');
  });

  it('sem correspondência, não executa nada e só o narrador responde', () => {
    const s = start();
    const r = localInterpret(s, 'Danço tango sozinho');
    expect(r.actionId).toBeNull();
    const after = freeText(s, 'Danço tango sozinho', r);
    expect(after.journal.clues).toEqual(s.journal.clues);
    expect(after.narrative.at(-1)?.kind).toBe('texto');
    expect(after.narrative.at(-1)?.text).toContain('não entendeu');
  });

  it('com correspondência, o motor executa a ação e registra a fala do jogador', () => {
    const s = start();
    const after = freeText(s, 'Vou dar uma olhada no jornal', { actionId: 'jornal', actorId: 'liz', narration: null, via: 'claude', lines: [], test: null, trust: null, minutes: 5 });
    expect(after.journal.clues.some((c) => c.id === 'noticia_corpos')).toBe(true);
    expect(after.narrative.some((e) => e.kind === 'fala' && e.text === 'Vou dar uma olhada no jornal' && e.speaker === 'Liz')).toBe(true);
  });

  it('no diálogo, a fala livre substitui o rótulo da opção', () => {
    let s = interact(start(), 'esperar_cliente');
    s = freeText(s, 'Quem a senhora procura, afinal?', { actionId: 'quem', actorId: null, narration: null, via: 'claude', lines: [], test: null, trust: null, minutes: 5 });
    expect(s.journal.clues.some((c) => c.id === 'thomas_desaparecido')).toBe(true);
    expect(s.narrative.some((e) => e.text === 'Quem a senhora procura, afinal?')).toBe(true);
    expect(s.narrative.some((e) => e.kind === 'fala' && e.text === 'Quem é o homem?')).toBe(false);
  });

  it('respostas do Claude com ação ou personagem inexistentes são rejeitadas', () => {
    const s = start();
    const r = validate(s, { acao: 'abrir_cofre_secreto', personagem: 'maggie', narracao: null }, 'abro o cofre');
    expect(r.actionId).toBeNull();
    expect(r.actorId).toBeNull();
    expect(r.narration).toBeTruthy();
  });

  it('o prompt enviado ao Claude contém só a camada do jogador', () => {
    let s = interact(start(), 'esperar_cliente');
    s = chooseOption(s, 'quem');
    const prompt = buildPrompt(s, 'Pergunto sobre o marido', 'jack');
    for (const n of INTERNAL_NPCS) for (const secret of n.secrets) expect(prompt).not.toContain(secret);
    for (const line of CONSPIRACY_OVERVIEW) expect(prompt).not.toContain(line);
    expect(prompt.toLowerCase()).not.toContain('vampir');
    expect(prompt).not.toContain('tracks');
    expect(prompt).toContain('"voltar"');
  });

  it('sem o Claude disponível, usa o interpretador local', async () => {
    const r = await interpret(null, start(), 'examinar o jornal', null);
    expect(r.via).toBe('local');
    expect(r.actionId).toBe('jornal');
  });

  it('um erro qualquer do Claude cai no interpretador local', async () => {
    const failing = Object.assign(async () => {
      throw { code: 'upstream_error', message: 'x' };
    }, { json: async () => ({}) });
    const r = await interpret(failing as never, start(), 'examinar o jornal', null);
    expect(r.via).toBe('local');
  });
});

describe('Imagens e áudio', () => {
  it('toda imagem referenciada pela campanha existe no catálogo', () => {
    const refs: string[] = [];
    for (const sc of Object.values(CAMPAIGN.scenes)) {
      if (sc.image) refs.push(sc.image);
      for (const it of sc.interactions) if (it.image) refs.push(it.image);
    }
    for (const d of Object.values(CAMPAIGN.dialogues)) if (d.image) refs.push(d.image);
    for (const c of Object.values(CAMPAIGN.clues)) if (c.image) refs.push(c.image);
    for (const ch of CHARACTERS) refs.push(`retrato_${ch.id}`);
    expect(refs.filter((r) => !IMAGE_BY_ID[r])).toEqual([]);
  });

  it('fotos de acervo sempre têm crédito, licença e fonte', () => {
    for (const s of IMAGE_SLOTS.filter((x) => x.bundled)) {
      expect(s.bundled!.credit).toBeTruthy();
      expect(s.bundled!.license).toBeTruthy();
      expect(s.bundled!.source).toMatch(/^https:\/\//);
    }
  });

  it('o foco visual acompanha cena, interação e diálogo', () => {
    let s = start();
    expect(s.visual).toBe('cena_escritorio');
    s = interact(s, 'jornal');
    expect(s.visual).toBe('obj_jornal');
    s = interact(s, 'esperar_cliente');
    expect(s.visual).toBe('npc_victoria');
  });

  it('a narração fala o texto e as falas, com a voz de cada personagem, e não lê rolagens', () => {
    let s = interact(start(), 'esperar_cliente');
    s = chooseOption(s, 'quem');
    const lines = entriesToLines(s.narrative, DEFAULT_VOICES, 1);
    expect(lines.every((l) => l.language === 'pt-BR')).toBe(true);
    expect(lines.some((l) => l.voice === DEFAULT_VOICES.feminino && l.role === 'f' && l.text.includes('Thomas Reed'))).toBe(true);
    expect(lines.some((l) => l.text.startsWith('Nova pista'))).toBe(false);
  });
});
