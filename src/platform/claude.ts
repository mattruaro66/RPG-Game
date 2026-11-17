/**
 * Acesso aos recursos do artefato no claude.ai (consulta ao Claude, voz,
 * ditado, upload de imagens, banco compartilhado, usuário).
 *
 * Tudo aqui é opcional: fora do claude.ai (npm run dev, arquivo salvo,
 * Safari, apps móveis, visitantes externos) cada recurso resolve `null` e o
 * jogo continua funcionando com alternativas locais.
 */

export type Voice = 'buttery' | 'airy' | 'glassy' | 'rounded';

export interface TtsLine {
  text: string;
  voice?: Voice;
  rate?: number;
  language?: string;
  id?: string;
}

export interface TtsApi {
  speak(what: string | TtsLine[], opts?: { voice?: Voice; rate?: number; language?: string }): Promise<{ playedMs: number }>;
  add(what: string | TtsLine[], opts?: { voice?: Voice; rate?: number; language?: string }): Promise<{ playedMs: number }>;
  stop(): Promise<void>;
  active(): boolean;
  onState(h: (e: { state: string; reason?: string }) => void): () => void;
  onLine(h: (e: { line: number; id?: string }) => void): () => void;
}

export interface SampleApi {
  (input: string | { role: 'user' | 'assistant'; content: string }[], opts?: Record<string, unknown>): Promise<{ text: string; truncated: boolean }>;
  json<T = unknown>(input: string | { role: 'user' | 'assistant'; content: string }[], opts?: Record<string, unknown>): Promise<T>;
}

export interface DictationApi {
  start(opts?: { language?: string }): Promise<void>;
  stop(): Promise<void>;
  active(): boolean;
  onPartial(h: (e: { text: string }) => void): () => void;
  onFinal(h: (e: { text: string }) => void): () => void;
  onState(h: (e: { state: string; reason?: string }) => void): () => void;
}

export interface AssetsApi {
  upload(blob: Blob, opts?: { type?: string }): Promise<{ id: string; url: string; sizeBytes: number; contentType: string }>;
}

export interface DocSnapshot {
  id: string;
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}

export interface DbApi {
  collection(path: string): {
    onSnapshot(next: (snap: { docs: DocSnapshot[] }) => void, error?: (e: { code: string; message: string }) => void): () => void;
    doc(id: string): { set(data: Record<string, unknown>): Promise<void>; delete(): Promise<void> };
  };
}

export interface UserApi {
  isOwner(): boolean;
  canEdit(): boolean;
}

interface CapabilityMap {
  tts: TtsApi;
  sample: SampleApi;
  dictation: DictationApi;
  assets: AssetsApi;
  db: DbApi;
  user: UserApi;
}

type ClaudeGlobal = { use?: (name: string) => Promise<unknown> };

export function useCapability<K extends keyof CapabilityMap>(name: K): Promise<CapabilityMap[K] | null> {
  try {
    const c = (window as unknown as { claude?: ClaudeGlobal }).claude;
    if (!c?.use) return Promise.resolve(null);
    return c.use(name).then((v) => (v ?? null) as CapabilityMap[K] | null).catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

export function errorCode(e: unknown): string {
  return typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : 'erro';
}
