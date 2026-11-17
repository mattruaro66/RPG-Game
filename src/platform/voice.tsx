import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CHARACTERS, shortName } from '../data/characters';
import { content } from '../engine/narrative/registry';
import type { NarrativeEntry } from '../engine/state';
import { useCapability, type TtsApi, type TtsLine, type Voice } from './claude';

/**
 * Narração e diálogos falados.
 * 1º: vozes do Claude (capacidade `tts` do artefato), em pt-BR.
 * 2º: voz sintetizada do navegador (Web Speech), quando disponível.
 */

export const VOICES: { id: Voice; label: string }[] = [
  { id: 'buttery', label: 'Voz 1 (buttery)' },
  { id: 'airy', label: 'Voz 2 (airy)' },
  { id: 'glassy', label: 'Voz 3 (glassy)' },
  { id: 'rounded', label: 'Voz 4 (rounded)' },
];

export const DEFAULT_VOICES: Record<string, Voice> = {
  narrador: 'buttery',
  jack: 'rounded',
  daniel: 'airy',
  mick: 'rounded',
  liz: 'glassy',
  maggie: 'airy',
  ray: 'airy',
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

const BROWSER_PITCH: Record<Voice, number> = { buttery: 1, airy: 1.15, glassy: 1.3, rounded: 0.8 };

export type VoiceMode = 'claude' | 'navegador' | 'nenhuma';

interface VoiceCtx {
  mode: VoiceMode;
  speaking: boolean;
  speakEntries(entries: NarrativeEntry[]): void;
  speakText(text: string, roleKey?: string): void;
  stop(): void;
  error: string | null;
}

const Ctx = createContext<VoiceCtx | null>(null);

const SPOKEN_KINDS = new Set(['cena', 'texto', 'fala', 'ia', 'perigo']);

function speakerKey(speaker: string | undefined): string {
  if (!speaker || speaker === 'Narrador') return 'narrador';
  for (const c of CHARACTERS) if (shortName(c) === speaker || c.name === speaker) return c.id;
  try {
    for (const n of Object.values(content().npcs)) if (n.name === speaker || n.alias === speaker) return n.id;
  } catch {
    /* campanha não registrada */
  }
  return 'outros';
}

function clean(text: string): string {
  return text.replace(/^—\s*/, '').replace(/\s+/g, ' ').trim().slice(0, 1900);
}

export type VoiceCasting = 'narrador' | 'personagens';

export function entriesToLines(entries: NarrativeEntry[], voices: Record<string, Voice>, rate: number, casting: VoiceCasting = 'personagens'): TtsLine[] {
  return entries
    .filter((e) => SPOKEN_KINDS.has(e.kind) && e.text.trim())
    .map((e) => {
      const key = casting === 'narrador' ? 'narrador' : e.kind === 'fala' || (e.kind === 'ia' && e.speaker !== 'Narrador') ? speakerKey(e.speaker) : 'narrador';
      return { text: clean(e.text), voice: voices[key] ?? voices.outros ?? 'rounded', rate, language: 'pt-BR', id: String(e.id) };
    });
}

export function VoiceProvider({ children, voices, rate, casting }: { children: ReactNode; voices: Record<string, Voice>; rate: number; casting: VoiceCasting }) {
  const [tts, setTts] = useState<TtsApi | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    return () => {
      alive = false;
      off?.();
    };
  }, []);

  const mode: VoiceMode = tts ? 'claude' : hasBrowser ? 'navegador' : 'nenhuma';

  const browserSpeak = useCallback((lines: TtsLine[]) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const pt = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('pt-br')) ?? synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('pt'));
    lines.forEach((l, i) => {
      const u = new SpeechSynthesisUtterance(l.text);
      u.lang = 'pt-BR';
      if (pt) u.voice = pt;
      u.pitch = BROWSER_PITCH[l.voice ?? 'buttery'];
      u.rate = l.rate ?? 1;
      if (i === 0) u.onstart = () => setSpeaking(true);
      if (i === lines.length - 1) u.onend = () => setSpeaking(false);
      synth.speak(u);
    });
  }, []);

  const play = useCallback(
    (lines: TtsLine[]) => {
      if (!lines.length) return;
      setError(null);
      if (tts) {
        tts.speak(lines).catch((e: { code?: string }) => {
          if (e?.code === 'not_granted') setError('A narração foi desativada para esta página.');
          else if (e?.code === 'no_gesture') setError('Clique em qualquer lugar da página para liberar o áudio.');
          else if (e?.code === 'rate_limited') setError('Narração pausada por excesso de uso.');
        });
      } else if (hasBrowser) browserSpeak(lines);
    },
    [tts, hasBrowser, browserSpeak],
  );

  const value = useMemo<VoiceCtx>(
    () => ({
      mode,
      speaking,
      error,
      speakEntries(entries) {
        const { voices: v, rate: r, casting: c } = settingsRef.current;
        play(entriesToLines(entries, v, r, c));
      },
      speakText(text, roleKey = 'narrador') {
        const { voices: v, rate: r } = settingsRef.current;
        play([{ text: clean(text), voice: v[roleKey] ?? 'buttery', rate: r, language: 'pt-BR' }]);
      },
      stop() {
        if (tts) tts.stop().catch(() => undefined);
        else if (hasBrowser) window.speechSynthesis.cancel();
        setSpeaking(false);
      },
    }),
    [mode, speaking, error, play, tts, hasBrowser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVoice(): VoiceCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useVoice fora do VoiceProvider');
  return c;
}
