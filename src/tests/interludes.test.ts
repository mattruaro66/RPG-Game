import { activeParty } from '../engine/narrative/conditions';
import { chooseOption, interact, newGame } from '../state/session';
import { partySelection } from './helpers';

const victoriaLeaves = (ids: Parameters<typeof partySelection>[0], seed = 41) => {
  let s = newGame(partySelection(ids), seed);
  s = interact(s, 'esperar_cliente');
  s = chooseOption(s, 'quem');
  s = chooseOption(s, 'voltar');
  s = chooseOption(s, 'aceitar');
  return chooseOption(s, 'fim');
};

describe('Cenas “Enquanto isso”', () => {
  it('depois que a cliente sai, a história corta para Daniel no Bellevue, sozinho', () => {
    const s = victoriaLeaves(['jack', 'daniel', 'mick', 'liz']);
    expect(s.sceneId).toBe('interludio_bellevue');
    expect(activeParty(s).map((c) => c.id)).toEqual(['daniel']);
    // Nada sobre perfurações aparece até Daniel ir ver o corpo.
    expect(s.narrative.some((e) => /perfura/i.test(e.text))).toBe(false);
  });

  it('as pistas do Bellevue surgem por ações de Daniel, não por exposição', () => {
    let s = victoriaLeaves(['jack', 'daniel', 'mick', 'liz']);
    s = interact(s, 'anotacoes');
    expect(s.journal.clues.map((c) => c.id)).toContain('paciente_exangue');
    s = interact(s, 'necroterio');
    expect(s.journal.clues.map((c) => c.id)).toContain('perfuracoes');
  });

  it('o atestado é uma decisão com consequência registrada', () => {
    let s = victoriaLeaves(['jack', 'daniel', 'mick', 'liz']);
    s = interact(s, 'anotacoes');
    s = interact(s, 'chefia');
    s = chooseOption(s, 'recusar');
    expect(s.flags.necropsia_pedida).toBe(true);
    expect(s.decisions.some((d) => d.id === 'necropsia_pedida')).toBe(true);
    s = chooseOption(s, 'fim');
    s = interact(s, 'balcao');
    expect(s.journal.clues.map((c) => c.id)).toContain('homem_de_terno');
    // O prontuário ainda não sumiu: isso só acontece depois.
    expect(s.journal.clues.map((c) => c.id)).not.toContain('prontuario_desaparecido');
  });

  it('em seguida, Liz na redação; depois o grupo volta ao escritório', () => {
    let s = victoriaLeaves(['jack', 'daniel', 'mick', 'liz']);
    s = interact(s, 'anotacoes');
    s = interact(s, 'chefia');
    s = chooseOption(s, 'assinar');
    s = interact(s, 'balcao');
    s = interact(s, 'fim_plantao');
    expect(s.sceneId).toBe('interludio_voice');
    expect(activeParty(s).map((c) => c.id)).toEqual(['liz']);
    s = interact(s, 'atender');
    s = chooseOption(s, 'anonimato');
    expect(s.journal.clues.map((c) => c.id)).toContain('fonte_funeraria');
    s = chooseOption(s, 'encontro');
    s = chooseOption(s, 'fim');
    s = interact(s, 'editor');
    s = chooseOption(s, 'esconder');
    s = interact(s, 'sair_redacao');
    expect(s.sceneId).toBe('escritorio_noite');
    expect(activeParty(s).map((c) => c.id)).toEqual(['jack']);
  });

  it('sem Daniel nem Liz no grupo, não há cenas intercaladas', () => {
    const s = victoriaLeaves(['jack', 'mick', 'maggie', 'ray']);
    expect(s.sceneId).toBe('escritorio_noite');
  });

  it('Victoria não despeja tudo: amante e certeza da morte só vêm quando perguntadas', () => {
    let s = newGame(partySelection(['jack', 'daniel', 'mick', 'liz']), 42);
    s = interact(s, 'esperar_cliente');
    s = chooseOption(s, 'quem');
    const said = s.narrative.map((e) => e.text).join(' ');
    expect(said).not.toMatch(/amante|morto/);
    s = chooseOption(s, 'voltar');
    s = chooseOption(s, 'relacao');
    expect(s.narrative.map((e) => e.text).join(' ')).toMatch(/amante/);
  });
});
