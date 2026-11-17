import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setProvisionalRules, type BonusOnusConflictPolicy, type MinDamagePolicy } from '../config/rules';
import type { GameState } from '../engine/state';
import type { CharacterSelection } from '../engine/party';
import { DEFAULT_SETTINGS, loadGame, loadSettings, saveGame, saveSettings, type Settings, type SlotId } from '../persistence/storage';
import { newGame } from './session';
import { DEFAULT_VOICES } from '../platform/voice';
import type { Voice } from '../platform/claude';

export type Screen = 'menu' | 'prologo' | 'selecao' | 'jogo' | 'personagens' | 'regras' | 'config' | 'carregar' | 'galeria';

export interface AppSettings extends Settings {
  minDamage: MinDamagePolicy;
  bonusOnusConflict: BonusOnusConflictPolicy;
  autoNarrate: boolean;
  voiceRate: number;
  voices: Record<string, Voice>;
}

interface Ctx {
  screen: Screen;
  go: (s: Screen) => void;
  game: GameState | null;
  update: (fn: (s: GameState) => GameState) => void;
  startNew: (sel: CharacterSelection[]) => void;
  load: (slot: SlotId) => boolean;
  save: (slot: SlotId) => void;
  quit: () => void;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  toast: string | null;
  notify: (msg: string) => void;
}

const GameCtx = createContext<Ctx | null>(null);

function initialSettings(): AppSettings {
  const base = loadSettings() as Partial<AppSettings>;
  const s = { ...DEFAULT_SETTINGS, minDamage: 0, bonusOnusConflict: 'onus_prevalece', autoNarrate: true, voiceRate: 1, ...base } as AppSettings;
  s.voices = { ...DEFAULT_VOICES, ...(base.voices ?? {}) };
  return s;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [game, setGame] = useState<GameState | null>(null);
  const [settings, setSettingsState] = useState<AppSettings>(initialSettings);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setProvisionalRules({ minDamage: settings.minDamage, bonusOnusConflict: settings.bonusOnusConflict });
  }, [settings.minDamage, settings.bonusOnusConflict]);

  useEffect(() => {
    if (game && settings.autosave) {
      try {
        saveGame('auto', game);
      } catch {
        /* armazenamento cheio ou indisponível */
      }
    }
  }, [game, settings.autosave]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2500);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      screen,
      go: setScreen,
      game,
      update: (fn) => setGame((g) => (g ? fn(g) : g)),
      startNew: (sel) => {
        setGame(newGame(sel));
        setScreen('jogo');
      },
      load: (slot) => {
        try {
          const g = loadGame(slot);
          if (!g) return false;
          setGame(g);
          setScreen('jogo');
          return true;
        } catch (e) {
          notify(e instanceof Error ? e.message : 'Não foi possível carregar.');
          return false;
        }
      },
      save: (slot) => {
        if (!game) return;
        saveGame(slot, game);
        notify('Jogo salvo.');
      },
      quit: () => {
        setScreen('menu');
      },
      settings,
      setSettings: (s) => {
        setSettingsState(s);
        saveSettings(s);
      },
      toast,
      notify,
    }),
    [screen, game, settings, toast, notify],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame(): Ctx {
  const c = useContext(GameCtx);
  if (!c) throw new Error('useGame fora do GameProvider');
  return c;
}
