import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CHARACTERS, CHARACTER_BY_ID, shortName } from '../data/characters';
import { content } from '../engine/narrative/registry';
import type { NarrativeEntry } from '../engine/state';
import type { CharacterId } from '../engine/types';
import { useCapability, type TtsApi, type TtsLine, type Voice } from './claude';

/**
 * Narração e diálogos falados, em português do Brasil.
 *
 * Catálogo de vozes = cada voz base × três variações (normal, mais grave e
 * lenta, mais rápida). Vozes base:
 *  - do Claude (capacidade `tts`): 4 vozes sem timbre oficial; o jogador as
 *    classifica uma vez como masculina/feminina (calibração);
 *  - do navegador: vozes pt-BR instaladas, classificadas pelo nome.
 *
 * Elenco: configuração base (narrador, NPCs masculinos, NPCs femininos) e
 * uma voz para cada protagonista, entre as opções do gênero dele.
 */

export type Gender = 'm' | 'f';
export type VoiceEngine = 'claude' | 'navegador';
export type VoiceCasting = 'elenco' | 'narrador';

export const CLAUDE_VOICES: Voice[] = ['buttery', 'airy', 'glassy', 'rounded'];
/** Palpite inicial até o jogador calibrar (não há informação oficial de timbre). */
export const DEFAULT_CLAUDE_GENDERS: Record<Voice, Gender> = { buttery: 'm', rounded: 'm', airy: 'f', glassy: 'f' };

export interface VoiceVariant {
  id: 'normal' | 'grave' | 'rapida';
  label: string;
  rate: number;
  pitch: number;
}

export const VARIANTS: VoiceVariant[] = [
  { id: 'normal', label: 'normal', rate: 1, pitch: 1 },
  { id: 'grave', label: 'mais grave e pausada', rate: 0.86, pitch: 0.85 },
  { id: 'rapida', label: 'mais viva e rápida', rate: 1.12, pitch: 1.12 },
];

export interface VoiceOption {
  /** "claude:<voz>:<variação>" ou "nav:<nome da voz>:<variação>". */
  id: string;
  engine: VoiceEngine;
  base: string;
  gender: Gender;
  variant: VoiceVariant;
  label: string;
}

/** Atribuições: chaves 'narrador', 'npc_m', 'npc_f' e ids dos protagonistas. */
export type CastAssign = Record<string, string>;

export interface VoiceSettings {
  engine: VoiceEngine;
  casting: VoiceCasting;
  rate: number;
  claudeGenders: Record<Voice, Gender>;
  cast: Partial<Record<VoiceEngine, CastAssign>>;
}

export const CAST_ROLES: { key: string; label: string; gender: Gender | null }[] = [
  { key: 'narrador', label: 'Narrador', gender: null },
  { key: 'npc_m', label: 'NPCs masculinos', gender: 'm' },
  { key: 'npc_f', label: 'NPCs femininos', gender: 'f' },
  ...CHARACTERS.map((c) => ({ key: c.id, label: shortName(c), gender: c.gender })),
];

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

const FEMALE_NAMES = ['maria', 'francisca', 'luciana', 'fernanda', 'vitoria', 'vitória', 'raquel', 'leticia', 'letícia', 'thalita', 'brenda', 'elza', 'giovanna', 'yara', 'manuela', 'leila', 'joana', 'camila', 'female', 'feminina', 'mulher', 'google português do brasil'];
const MALE_NAMES = ['daniel', 'antonio', 'antônio', 'felipe', 'fabio', 'fábio', 'julio', 'júlio', 'donato', 'humberto', 'valerio', 'valério', 'nicolau', 'male', 'masculina', 'homem'];

export function classifyBrowserVoice(name: string): Gender | null {
  const n = name.toLowerCase();
  if (MALE_NAMES.some((m) => n.includes(m))) return 'm';
  if (FEMALE_NAMES.some((f) => n.includes(f))) return 'f';
  return null;
}

const CLAUDE_LABEL: Record<Voice, string> = { buttery: 'Buttery', airy: 'Airy', glassy: 'Glassy', rounded: 'Rounded' };

export function claudeCatalog(genders: Record<Voice, Gender>): VoiceOption[] {
  return CLAUDE_VOICES.flatMap((v) =>
    VARIANTS.map((variant) => ({
      id: `claude:${v}:${variant.id}`,
      engine: 'claude' as const,
      base: v,
      gender: genders[v],
      variant,
      label: `${CLAUDE_LABEL[v]} — ${variant.label}`,
    })),
  );
}

export function browserCatalog(voiceNames: string[]): VoiceOption[] {
  return voiceNames.flatMap((name) => {
    const g = classifyBrowserVoice(name);
    const genders: Gender[] = g ? [g] : ['m', 'f'];
    return genders.flatMap((gender) =>
      VARIANTS.map((variant) => ({
        id: `nav:${name}:${gender}:${variant.id}`,
        engine: 'navegador' as const,
        base: name,
        gender,
        // Voz sem gênero conhecido: o tom aproxima o gênero pedido.
        variant: g ? variant : { ...variant, pitch: variant.pitch * (gender === 'm' ? 0.8 : 1.25) },
        label: `${name.replace(/ - Portuguese \(Brazil\)|\(Natural\)|Microsoft |Online /g, '').trim()}${g ? '' : gender === 'm' ? ' (tom grave)' : ' (tom agudo)'} — ${variant.label}`,
      })),
    );
  });
}

/** Elenco automático: tenta dar a cada papel uma voz diferente. */
export function autoCast(catalog: VoiceOption[]): CastAssign {
  const male = catalog.filter((o) => o.gender === 'm');
  const female = catalog.filter((o) => o.gender === 'f');
  const byVariant = (list: VoiceOption[], variant: VoiceVariant['id']) => list.filter((o) => o.variant.id === variant);
  const pick = (list: VoiceOption[], i: number) => (list.length ? list[i % list.length].id : catalog[0]?.id ?? '');
  const out: CastAssign = {};
  const maleBases = [...new Set(male.map((o) => o.base))];
  // Narrador: versão grave da primeira voz masculina (ou feminina, se não houver).
  out.narrador = pick(byVariant(male.length ? male : female, 'grave'), 0);
  out.npc_m = pick(byVariant(male, 'normal'), maleBases.length > 1 ? 1 : 0);
  out.npc_f = pick(byVariant(female, 'normal'), 0);
  // Protagonistas: percorre as opções do gênero, pulando as já usadas.
  const used = new Set(Object.values(out));
  for (const c of CHARACTERS) {
    const pool = c.gender === 'm' ? male : female;
    const ordered = [...byVariant(pool, 'normal'), ...byVariant(pool, 'rapida'), ...byVariant(pool, 'grave')];
    const free = ordered.find((o) => !used.has(o.id)) ?? ordered[0];
    if (free) {
      out[c.id] = free.id;
      used.add(free.id);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Quem fala
// ---------------------------------------------------------------------------

const SPOKEN_KINDS = new Set(['cena', 'texto', 'fala', 'ia', 'perigo']);

/** Papel de quem fala: 'narrador', id de protagonista ou de NPC, ou 'outros'. */
export function speakerKey(speaker: string | undefined): string {
  if (!speaker || speaker === 'Narrador') return 'narrador';
  for (const c of CHARACTERS) if (shortName(c) === speaker || c.name === speaker || c.name.split(' ')[0] === speaker) return c.id;
  try {
    for (const n of Object.values(content().npcs)) {
      if (n.name === speaker || n.alias === speaker || n.voiceNames?.includes(speaker)) return n.id;
    }
  } catch {
    /* campanha não registrada */
  }
  return 'outros';
}

export function genderOf(key: string): Gender | null {
  if (key === 'narrador') return null;
  const ch = CHARACTER_BY_ID[key as CharacterId];
  if (ch) return ch.gender;
  try {
    const n = content().npcs[key];
    if (n?.gender) return n.gender;
  } catch {
    /* ignora */
  }
  return key === 'outros' ? 'm' : null;
}

/** Chave de elenco para um papel: protagonista → id; NPC → npc_m/npc_f; resto → narrador. */
export function castKey(key: string): string {
  if (key === 'narrador') return 'narrador';
  if (CHARACTER_BY_ID[key as CharacterId]) return key;
  const g = genderOf(key);
  return g === 'f' ? 'npc_f' : g === 'm' ? 'npc_m' : 'narrador';
}

function clean(text: string): string {
  return text.replace(/^—\s*/, '').replace(/\s+/g, ' ').trim().slice(0, 1900);
}

export interface CastLine {
  text: string;
  id?: string;
  /** Papel resolvido (para testes e para o motor). */
  key: string;
  option: VoiceOption | null;
  rate: number;
}

export function entriesToLines(entries: NarrativeEntry[], catalog: VoiceOption[], cast: CastAssign, rate = 1, casting: VoiceCasting = 'elenco'): CastLine[] {
  const byId = new Map(catalog.map((o) => [o.id, o]));
  const auto = autoCast(catalog);
  return entries
    .filter((e) => SPOKEN_KINDS.has(e.kind) && e.text.trim())
    .map((e) => {
      const isSpeech = e.kind === 'fala' || (e.kind === 'ia' && e.speaker !== 'Narrador');
      const key = casting === 'narrador' || !isSpeech ? 'narrador' : castKey(speakerKey(e.speaker));
      const option = byId.get(cast[key]) ?? byId.get(auto[key]) ?? null;
      const r = Math.min(1.5, Math.max(0.7, (option?.variant.rate ?? 1) * rate));
      return { text: clean(e.text), id: String(e.id), key, option, rate: r };
    });
}

// ---------------------------------------------------------------------------
// Provedor
// ---------------------------------------------------------------------------

export type VoiceMode = 'claude' | 'navegador' | 'nenhuma';

interface VoiceCtx {
  mode: VoiceMode;
  claudeAvailable: boolean;
  catalog: VoiceOption[];
  cast: CastAssign;
  speaking: boolean;
  speakEntries(entries: NarrativeEntry[]): void;
  /** Fala um texto com um papel do elenco ou com uma opção específica. */
  speakText(text: string, roleOrOption?: string): void;
  stop(): void;
  error: string | null;
}

const Ctx = createContext<VoiceCtx | null>(null);

function listBrowserVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const all = window.speechSynthesis.getVoices();
  const br = all.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('pt-br'));
  return br.length ? br : all.filter((v) => v.lang.toLowerCase().startsWith('pt'));
}

export function VoiceProvider({ children, settings }: { children: ReactNode; settings: VoiceSettings }) {
  const [tts, setTts] = useState<TtsApi | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>(listBrowserVoices);
  const hasBrowser = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    let alive = true;
    let off: (() => void) | undefined;
    useCapability('tts').then((t) => {
      if (!alive || !t) return;
      setTts(t);
      try {
        off = t.onState(({ state, reason }) => {
          setSpeaking(state === 'speaking' || state === 'starting');
          if (reason === 'not_granted') setError('A narração foi desativada para esta página.');
          else if (reason === 'rate_limited') setError('Narração pausada por excesso de uso. Tente de novo em instantes.');
        });
      } catch {
        /* ignora */
      }
    });
    const refresh = () => alive && setBrowserVoices(listBrowserVoices());
    if (hasBrowser) window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
    return () => {
      alive = false;
      off?.();
      if (hasBrowser) window.speechSynthesis.removeEventListener?.('voiceschanged', refresh);
    };
  }, [hasBrowser]);

  const engine: VoiceEngine = tts && settings.engine === 'claude' ? 'claude' : 'navegador';
  const mode: VoiceMode = engine === 'claude' ? 'claude' : hasBrowser ? 'navegador' : 'nenhuma';
  const catalog = useMemo(
    () => (engine === 'claude' ? claudeCatalog(settings.claudeGenders) : browserCatalog(browserVoices.length ? browserVoices.map((v) => v.name) : ['Voz do sistema'])),
    [engine, settings.claudeGenders, browserVoices],
  );
  const cast = useMemo(() => ({ ...autoCast(catalog), ...(settings.cast[engine] ?? {}) }), [catalog, settings.cast, engine]);

  const ref = useRef({ catalog, cast, settings });
  ref.current = { catalog, cast, settings };

  const play = useCallback(
    (lines: CastLine[]) => {
      if (!lines.length) return;
      setError(null);
      if (engine === 'claude' && tts) {
        const plain: TtsLine[] = lines.map((l) => ({ text: l.text, voice: (l.option?.base as Voice) ?? 'buttery', rate: l.rate, language: 'pt-BR', id: l.id }));
        tts.speak(plain).catch((e: { code?: string }) => {
          if (e?.code === 'not_granted') setError('A narração foi desativada para esta página.');
          else if (e?.code === 'no_gesture') setError('Clique em qualquer lugar da página para liberar o áudio.');
          else if (e?.code === 'rate_limited') setError('Narração pausada por excesso de uso.');
        });
        return;
      }
      if (!hasBrowser) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      lines.forEach((l, i) => {
        const u = new SpeechSynthesisUtterance(l.text);
        u.lang = 'pt-BR';
        const v = browserVoices.find((x) => x.name === l.option?.base);
        if (v) u.voice = v;
        u.pitch = l.option?.variant.pitch ?? 1;
        u.rate = l.rate;
        if (i === 0) u.onstart = () => setSpeaking(true);
        if (i === lines.length - 1) u.onend = () => setSpeaking(false);
        synth.speak(u);
      });
    },
    [engine, tts, hasBrowser, browserVoices],
  );

  const value = useMemo<VoiceCtx>(
    () => ({
      mode,
      claudeAvailable: !!tts,
      catalog,
      cast,
      speaking,
      error,
      speakEntries(entries) {
        const { catalog: c, cast: k, settings: s } = ref.current;
        play(entriesToLines(entries, c, k, s.rate, s.casting));
      },
      speakText(text, roleOrOption = 'narrador') {
        const { catalog: c, cast: k, settings: s } = ref.current;
        const option = c.find((o) => o.id === roleOrOption) ?? c.find((o) => o.id === k[roleOrOption]) ?? c[0] ?? null;
        const rate = Math.min(1.5, Math.max(0.7, (option?.variant.rate ?? 1) * s.rate));
        play([{ text: clean(text), key: roleOrOption, option, rate }]);
      },
      stop() {
        if (tts) tts.stop().catch(() => undefined);
        if (hasBrowser) window.speechSynthesis.cancel();
        setSpeaking(false);
      },
    }),
    [mode, tts, catalog, cast, speaking, error, play, hasBrowser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVoice(): VoiceCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useVoice fora do VoiceProvider');
  return c;
}
