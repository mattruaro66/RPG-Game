import '../data/campaign';
import { autoCast, browserCatalog, castKey, classifyBrowserVoice, claudeCatalog, DEFAULT_CLAUDE_GENDERS, entriesToLines, genderOf, speakerKey } from '../platform/voice';
import type { NarrativeEntry } from '../engine/state';
import { CHARACTERS } from '../data/characters';

const e = (id: number, kind: NarrativeEntry['kind'], text: string, speaker?: string): NarrativeEntry => ({ id, kind, text, speaker, time: 0 });
const catalog = claudeCatalog(DEFAULT_CLAUDE_GENDERS);
const cast = autoCast(catalog);
const byId = new Map(catalog.map((o) => [o.id, o]));

describe('Catálogo e elenco de vozes', () => {
  it('cada voz base vira três opções; há várias opções por gênero', () => {
    expect(catalog).toHaveLength(12);
    expect(catalog.filter((o) => o.gender === 'm').length).toBe(6);
    expect(catalog.filter((o) => o.gender === 'f').length).toBe(6);
  });

  it('elenco automático: protagonistas com voz do próprio gênero e sem repetir entre si', () => {
    for (const c of CHARACTERS) expect(byId.get(cast[c.id])?.gender).toBe(c.gender);
    const protagonistVoices = CHARACTERS.map((c) => cast[c.id]);
    expect(new Set(protagonistVoices).size).toBe(protagonistVoices.length);
    expect(byId.get(cast.npc_m)?.gender).toBe('m');
    expect(byId.get(cast.npc_f)?.gender).toBe('f');
  });

  it('NPCs femininos usam a voz base feminina; masculinos, a masculina; narração, o narrador', () => {
    const lines = entriesToLines([
      e(1, 'texto', 'A porta se abre.'),
      e(2, 'fala', '— Preciso que encontre um homem.', 'A mulher de vermelho'),
      e(3, 'fala', 'Já disse o que sei.', 'Sal'),
      e(4, 'fala', 'O chefe quer a caderneta.', 'Invasor'),
      e(5, 'fala', 'Quem é o homem?', 'Jack'),
      e(6, 'fala', 'Estou indo.', 'Liz'),
    ], catalog, cast);
    expect(lines.map((l) => l.key)).toEqual(['narrador', 'npc_f', 'npc_m', 'npc_m', 'jack', 'liz']);
    expect(lines[1].option?.id).toBe(cast.npc_f);
    expect(lines[2].option?.id).toBe(cast.npc_m);
    expect(lines[4].option?.id).toBe(cast.jack);
  });

  it('a escolha do jogador prevalece sobre o elenco automático', () => {
    const custom = { ...cast, jack: 'claude:buttery:rapida' };
    expect(entriesToLines([e(1, 'fala', 'Oi', 'Jack')], catalog, custom)[0].option?.id).toBe('claude:buttery:rapida');
  });

  it('no modo audiolivro, tudo sai com a voz do narrador', () => {
    const lines = entriesToLines([e(1, 'fala', 'Oi', 'Liz'), e(2, 'fala', 'Oi', 'Jack')], catalog, cast, 1, 'narrador');
    expect(lines.every((l) => l.option?.id === cast.narrador)).toBe(true);
  });

  it('a velocidade da variação respeita os limites do motor', () => {
    const lines = entriesToLines([e(1, 'fala', 'Oi', 'Jack')], catalog, { ...cast, jack: 'claude:rounded:rapida' }, 1.5);
    expect(lines[0].rate).toBeLessThanOrEqual(1.5);
  });

  it('recalibrar uma voz muda o gênero das opções dela', () => {
    const cat2 = claudeCatalog({ ...DEFAULT_CLAUDE_GENDERS, buttery: 'f' });
    expect(cat2.filter((o) => o.base === 'buttery').every((o) => o.gender === 'f')).toBe(true);
  });

  it('reconhece quem fala e o papel no elenco', () => {
    expect(speakerKey('A mulher de vermelho')).toBe('victoria');
    expect(castKey('victoria')).toBe('npc_f');
    expect(castKey('sal')).toBe('npc_m');
    expect(castKey('mick')).toBe('mick');
    expect(genderOf('thomas')).toBe('m');
  });

  it('vozes do navegador: classificadas pelo nome; desconhecidas servem aos dois gêneros pelo tom', () => {
    expect(classifyBrowserVoice('Microsoft Daniel - Portuguese (Brazil)')).toBe('m');
    expect(classifyBrowserVoice('Microsoft Francisca Online (Natural) - Portuguese (Brazil)')).toBe('f');
    expect(classifyBrowserVoice('Google português do Brasil')).toBe('f');
    const nav = browserCatalog(['Microsoft Daniel - Portuguese (Brazil)', 'Microsoft Maria - Portuguese (Brazil)', 'Voz X']);
    expect(nav.filter((o) => o.gender === 'm').length).toBe(6);
    expect(nav.filter((o) => o.gender === 'f').length).toBe(6);
  });
});
