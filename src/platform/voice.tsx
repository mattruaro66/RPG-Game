import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CHARACTERS, CHARACTER_BY_ID, shortName } from '../data/characters';
import { content } from '../engine/narrative/registry';
import type { NarrativeEntry } from '../engine/state';
import type { CharacterId } from '../engine/types';
import { useCapability, type TtsApi, type TtsLine, type Voice } from './claude';

/**
 * Narração e diálogos falados, em português do Brasil.
 *
 * Elenco padrão (por gênero): uma voz para o narrador, uma voz masculina
 * para todos os homens e uma feminina para todas as mulheres.
 *
 * Motores:
 *  - vozes do Claude (capacidade `tts` do artefato) — 4 vozes, sem
 *    indicação oficial de timbre; em pt-BR podem soar parecidas;
 *  - vozes do navegador (Web Speech) — usa as vozes pt-BR instaladas,
 *    separando masculinas e femininas pelo nome (ex.: Daniel/Maria no
 *    Windows, Luciana/Felipe no macOS).
 */

export const VOICES: { id: Voice; label: string }[] = [
  { id: 'buttery', label: 'Voz 1 (buttery)' },
  { id: 'airy', label: 'Voz 2 (airy)' },
  { id: 'glassy', label: 'Voz 3 (glassy)' },
  { id: 'rounded', label: 'Voz 4 (rounded)' },
];

export type Gender = 'm' | 'f';
export type VoiceCasting = 'genero' | 'narrador' | 'personagens';
export type VoiceEngine = 'claude' | 'navegador';

/** Vozes do Claude por papel. `masculino`/`feminino` valem no elenco por gênero. */
export const DEFAULT_VOICES: Record<string, Voice> = {
  narrador: 'buttery',
  masculino: 'rounded',
  feminino: 'airy',
  jack: 'rounded',
  daniel: 'rounded',
  mick: 'rounded',
  ray: 'rounded',
  liz: 'airy',
  maggie: 'airy',
  victoria: 'glassy',
  sal: 'rounded',
  outros: 'rounded',
};

export const VOICE_ROLES: { key: string; label: string }[] = [
  { key: 'narrador', label: 'Narrador' },
  ...CHARACTERS.map((c) => ({ key: c.id, label: shortName(c) })),
  { key: 'victoria', label: 'Victoria Whitmore' },
  { key: 'sal', label: 'Sal Benedetto' },
  { key: 'outros', label: 'Outros personagens' },
];

export type VoiceMode = 'claude' | 'navegador' | 'nenhuma';

interface VoiceCtx {
  mode: VoiceMode;
  claudeAvailable: boolean;
  browserVoices: { male: string | null; female: string | null; narrator: string | null };
  speaking: boolean;
  speakEntries(entries: NarrativeEntry[]): void;
  speakText(text: string, role?: string): void;
  stop(): void;
  error: string | null;
}

const Ctx = createContext<VoiceCtx | null>(null);

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

function clean(text: string): string {
  return text.replace(/^—\s*/, '').replace(/\s+/g, ' ').trim().slice(0, 1900);
}

/** Linha pronta para falar, com o papel resolvido (para o motor do navegador). */
export interface CastLine extends TtsLine {
  role: 'narrador' | Gender;
}

export function entriesToLines(entries: NarrativeEntry[], voices: Record<string, Voice>, rate: number, casting: VoiceCasting = 'genero'): CastLine[] {
  return entries
    .filter((e) => SPOKEN_KINDS.has(e.kind) && e.text.trim())
    .map((e) => {
      const isSpeech = e.kind === 'fala' || (e.kind === 'ia' && e.speaker !== 'Narrador');
      const key = isSpeech ? speakerKey(e.speaker) : 'narrador';
      const gender = genderOf(key);
      const role: CastLine['role'] = casting === 'narrador' || !gender ? 'narrador' : gender;
      let voice: Voice;
      if (casting === 'narrador' || role === 'narrador') voice = voices.narrador ?? 'buttery';
      else if (casting === 'genero') voice = role === 'm' ? voices.masculino ?? 'rounded' : voices.feminino ?? 'airy';
      else voice = voices[key] ?? (role === 'm' ? voices.masculino : voices.feminino) ?? 'rounded';
      return { text: clean(e.text), voice, rate, language: 'pt-BR', id: String(e.id), role };
    });
}

// ---------------------------------------------------------------------------
// Vozes do navegador
// ---------------------------------------------------------------------------

const FEMALE_NAMES = ['maria', 'francisca', 'luciana', 'fernanda', 'vitoria', 'vitória', 'raquel', 'leticia', 'letícia', 'thalita', 'brenda', 'elza', 'giovanna', 'yara', 'manuela', 'leila', 'joana', 'camila', 'female', 'feminina', 'mulher', 'google português do brasil'];
const MALE_NAMES = ['daniel', 'antonio', 'antônio', 'felipe', 'fabio', 'fábio', 'julio', 'júlio', 'donato', 'humberto', 'valerio', 'valério', 'nicolau', 'macerio', 'male', 'masculina', 'homem'];

export function classifyBrowserVoice(name: string): Gender | null {
  const n = name.toLowerCase();
  if (MALE_NAMES.some((m) => n.includes(m))) return 'm';
  if (FEMALE_NAMES.some((f) => n.includes(f))) return 'f';
  return null;
}

function pickBrowserVoices(): { male: SpeechSynthesisVoice | null; female: SpeechSynthesisVoice | null; narrator: SpeechSynthesisVoice | null } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return { male: null, female: null, narrator: null };
  const all = window.speechSynthesis.getVoices();
  const br = all.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('pt-br'));
  const pt = br.length ? br : all.filter((v) => v.lang.toLowerCase().startsWith('pt'));
  const male = pt.filter((v) => classifyBrowserVoice(v.name) === 'm');
  const female = pt.filter((v) => classifyBrowserVoice(v.name) === 'f');
  const m = male[0] ?? null;
  const f = female[0] ?? null;
  // Narrador: uma terceira voz masculina, se houver; senão a masculina.
  const narrator = male[1] ?? m ?? pt.find((v) => v !== f) ?? pt[0] ?? null;
  return { male: m, female: f, narrator };
}

// ---------------------------------------------------------------------------

export function VoiceProvider({ children, voices, rate, casting, engine }: { children: ReactNode; voices: Record<string, Voice>; rate: number; casting: VoiceCasting; engine: VoiceEngine }) {
  const [tts, setTts] = useState<TtsApi | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browserSet, setBrowserSet] = useState(pickBrowserVoices);
  const hasBrowser = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const settingsRef = useRef({ voices, rate, casting });
  settingsRef.current = { voices, rate, casting };

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
    if (hasBrowser) {
      const refresh = () => alive && setBrowserSet(pickBrowserVoices());
      window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
      return () => {
        alive = false;
        off?.();
        window.speechSynthesis.removeEventListener?.('voiceschanged', refresh);
      };
    }
    return () => {
      alive = false;
      off?.();
    };
  }, [hasBrowser]);

  const useClaude = !!tts && engine === 'claude';
  const mode: VoiceMode = useClaude ? 'claude' : hasBrowser ? 'navegador' : 'nenhuma';

  const browserSpeak = useCallback(
    (lines: CastLine[]) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      lines.forEach((l, i) => {
        const u = new SpeechSynthesisUtterance(l.text);
        u.lang = 'pt-BR';
        const v = l.role === 'm' ? browserSet.male : l.role === 'f' ? browserSet.female : browserSet.narrator;
        if (v) u.voice = v;
        // Sem voz do gênero instalada: aproxima pelo tom.
        u.pitch = !v ? (l.role === 'f' ? 1.35 : l.role === 'm' ? 0.75 : 0.95) : l.role === 'narrador' && v === browserSet.male ? 0.9 : 1;
        u.rate = l.rate ?? 1;
        if (i === 0) u.onstart = () => setSpeaking(true);
        if (i === lines.length - 1) u.onend = () => setSpeaking(false);
        synth.speak(u);
      });
    },
    [browserSet],
  );

  const play = useCallback(
    (lines: CastLine[]) => {
      if (!lines.length) return;
      setError(null);
      if (useClaude && tts) {
        const plain: TtsLine[] = lines.map(({ text, voice, rate: r, language, id }) => ({ text, voice, rate: r, language, id }));
        tts.speak(plain).catch((e: { code?: string }) => {
          if (e?.code === 'not_granted') setError('A narração foi desativada para esta página.');
          else if (e?.code === 'no_gesture') setError('Clique em qualquer lugar da página para liberar o áudio.');
          else if (e?.code === 'rate_limited') setError('Narração pausada por excesso de uso.');
        });
      } else if (hasBrowser) browserSpeak(lines);
    },
    [useClaude, tts, hasBrowser, browserSpeak],
  );

  const value = useMemo<VoiceCtx>(
    () => ({
      mode,
      claudeAvailable: !!tts,
      browserVoices: { male: browserSet.male?.name ?? null, female: browserSet.female?.name ?? null, narrator: browserSet.narrator?.name ?? null },
      speaking,
      error,
      speakEntries(entries) {
        const { voices: v, rate: r, casting: c } = settingsRef.current;
        play(entriesToLines(entries, v, r, c));
      },
      speakText(text, role = 'narrador') {
        const { voices: v, rate: r } = settingsRef.current;
        const g: CastLine['role'] = role === 'masculino' ? 'm' : role === 'feminino' ? 'f' : genderOf(role) ?? 'narrador';
        play([{ text: clean(text), voice: v[role] ?? 'buttery', rate: r, language: 'pt-BR', role: g }]);
      },
      stop() {
        if (tts) tts.stop().catch(() => undefined);
        if (hasBrowser) window.speechSynthesis.cancel();
        setSpeaking(false);
      },
    }),
    [mode, tts, browserSet, speaking, error, play, hasBrowser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVoice(): VoiceCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useVoice fora do VoiceProvider');
  return c;
}
