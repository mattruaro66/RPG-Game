import { SAVE_VERSION, type GameState } from '../engine/state';
import { formatDateTime } from '../engine/time';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type SlotId = 'auto' | 'slot1' | 'slot2' | 'slot3';
export const SLOTS: SlotId[] = ['auto', 'slot1', 'slot2', 'slot3'];
export const SLOT_LABELS: Record<SlotId, string> = { auto: 'Salvamento automático', slot1: 'Arquivo 1', slot2: 'Arquivo 2', slot3: 'Arquivo 3' };

const PREFIX = 'ny1992:save:';

export interface SaveFile {
  version: number;
  savedAt: string;
  summary: string;
  state: GameState;
}

export interface SaveMeta {
  slot: SlotId;
  savedAt: string;
  summary: string;
}

function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

let backend: StorageLike | null = null;

export function storage(): StorageLike {
  if (backend) return backend;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ny1992:probe', '1');
      localStorage.removeItem('ny1992:probe');
      backend = localStorage;
      return backend;
    }
  } catch {
    /* armazenamento indisponível */
  }
  backend = memoryStorage();
  return backend;
}

export function setStorage(s: StorageLike): void {
  backend = s;
}

export function serialize(state: GameState): string {
  const file: SaveFile = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    summary: formatDateTime(state.time),
    state,
  };
  return JSON.stringify(file);
}

/** Migrações futuras entram aqui (versão do arquivo → versão atual). */
function migrate(file: SaveFile): SaveFile {
  if (file.version > SAVE_VERSION) throw new Error('Arquivo salvo por uma versão mais nova do jogo.');
  return file;
}

export function deserialize(raw: string): SaveFile {
  const parsed = JSON.parse(raw) as SaveFile;
  if (!parsed || typeof parsed !== 'object' || !parsed.state || !Array.isArray(parsed.state.party)) {
    throw new Error('Arquivo de salvamento inválido.');
  }
  return migrate(parsed);
}

export function saveGame(slot: SlotId, state: GameState): SaveMeta {
  const raw = serialize(state);
  storage().setItem(PREFIX + slot, raw);
  const f = JSON.parse(raw) as SaveFile;
  return { slot, savedAt: f.savedAt, summary: f.summary };
}

export function loadGame(slot: SlotId): GameState | null {
  const raw = storage().getItem(PREFIX + slot);
  if (!raw) return null;
  return deserialize(raw).state;
}

export function listSaves(): (SaveMeta | null)[] {
  return SLOTS.map((slot) => {
    const raw = storage().getItem(PREFIX + slot);
    if (!raw) return null;
    try {
      const f = deserialize(raw);
      return { slot, savedAt: f.savedAt, summary: f.summary };
    } catch {
      return null;
    }
  });
}

export function deleteSave(slot: SlotId): void {
  storage().removeItem(PREFIX + slot);
}

export function latestSave(): SaveMeta | null {
  return listSaves()
    .filter((x): x is SaveMeta => !!x)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0] ?? null;
}

// Configurações (separadas do salvamento da campanha)
export interface Settings {
  showDiceDetails: boolean;
  gmMode: boolean;
  aiTurnDelayMs: number;
  autosave: boolean;
}

export const DEFAULT_SETTINGS: Settings = { showDiceDetails: true, gmMode: false, aiTurnDelayMs: 700, autosave: true };

export function loadSettings(): Settings {
  try {
    const raw = storage().getItem('ny1992:settings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    storage().setItem('ny1992:settings', JSON.stringify(s));
  } catch {
    /* ignora */
  }
}
