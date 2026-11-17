import '../data/campaign';
import { classifyBrowserVoice, DEFAULT_VOICES, entriesToLines, genderOf, speakerKey } from '../platform/voice';
import type { NarrativeEntry } from '../engine/state';
import { CHARACTERS } from '../data/characters';

const e = (id: number, kind: NarrativeEntry['kind'], text: string, speaker?: string): NarrativeEntry => ({ id, kind, text, speaker, time: 0 });

describe('Elenco de vozes', () => {
  it('todo protagonista tem gênero definido', () => {
    expect(CHARACTERS.map((c) => [c.id, c.gender])).toEqual([
      ['jack', 'm'], ['daniel', 'm'], ['mick', 'm'], ['liz', 'f'], ['maggie', 'f'], ['ray', 'm'],
    ]);
  });

  it('por padrão: narrador, voz masculina para homens e feminina para mulheres', () => {
    const lines = entriesToLines([
      e(1, 'texto', 'A porta se abre.'),
      e(2, 'fala', 'Quem é o homem?', 'Jack'),
      e(3, 'fala', '— Preciso que encontre um homem.', 'A mulher de vermelho'),
      e(4, 'fala', 'Estou indo.', 'Liz'),
      e(5, 'fala', 'Já disse o que sei.', 'Sal'),
      e(6, 'fala', 'O chefe quer a caderneta.', 'Invasor'),
      e(7, 'ia', 'Faz frio.', 'Narrador'),
      e(8, 'ia', 'Anota isso.', 'Maggie'),
    ], DEFAULT_VOICES, 1);
    expect(lines.map((l) => l.role)).toEqual(['narrador', 'm', 'f', 'f', 'm', 'm', 'narrador', 'f']);
    expect(lines.map((l) => l.voice)).toEqual([
      DEFAULT_VOICES.narrador, DEFAULT_VOICES.masculino, DEFAULT_VOICES.feminino, DEFAULT_VOICES.feminino,
      DEFAULT_VOICES.masculino, DEFAULT_VOICES.masculino, DEFAULT_VOICES.narrador, DEFAULT_VOICES.feminino,
    ]);
    expect(lines.every((l) => l.language === 'pt-BR')).toBe(true);
  });

  it('as três vozes do elenco padrão são diferentes entre si', () => {
    expect(new Set([DEFAULT_VOICES.narrador, DEFAULT_VOICES.masculino, DEFAULT_VOICES.feminino]).size).toBe(3);
  });

  it('no modo audiolivro, tudo sai com a voz do narrador', () => {
    const lines = entriesToLines([e(1, 'fala', 'Oi', 'Liz'), e(2, 'fala', 'Oi', 'Jack')], DEFAULT_VOICES, 1, 'narrador');
    expect(lines.every((l) => l.voice === DEFAULT_VOICES.narrador && l.role === 'narrador')).toBe(true);
  });

  it('reconhece quem fala pelo nome, apelido ou nome curto', () => {
    expect(speakerKey('Victoria Whitmore')).toBe('victoria');
    expect(speakerKey('A mulher de vermelho')).toBe('victoria');
    expect(speakerKey('Sal')).toBe('sal');
    expect(speakerKey('Mick')).toBe('mick');
    expect(genderOf('victoria')).toBe('f');
    expect(genderOf('thomas')).toBe('m');
  });

  it('separa vozes pt-BR do navegador por gênero', () => {
    expect(classifyBrowserVoice('Microsoft Daniel - Portuguese (Brazil)')).toBe('m');
    expect(classifyBrowserVoice('Microsoft Maria - Portuguese (Brazil)')).toBe('f');
    expect(classifyBrowserVoice('Microsoft Antonio Online (Natural) - Portuguese (Brazil)')).toBe('m');
    expect(classifyBrowserVoice('Microsoft Francisca Online (Natural) - Portuguese (Brazil)')).toBe('f');
    expect(classifyBrowserVoice('Luciana')).toBe('f');
    expect(classifyBrowserVoice('Felipe')).toBe('m');
    expect(classifyBrowserVoice('Google português do Brasil')).toBe('f');
  });
});
