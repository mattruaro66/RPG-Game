import { CHARACTER_BY_ID } from '../data/characters';
import type { Voice } from '../platform/claude';
import { CAST_ROLES, CLAUDE_VOICES, autoCast, type Gender, type VoiceOption } from '../platform/voice';
import { useVoice } from '../platform/voice';
import { useGame } from '../state/GameContext';
import type { CharacterId } from '../engine/types';

const SAMPLE: Record<string, string> = {
  narrador: 'Nova Iorque, primeiro de dezembro de mil novecentos e noventa e dois. A cidade nunca dorme.',
  m: 'Você vai falar agora, ou vai falar com a polícia depois.',
  f: 'Preciso que encontre um homem.',
};

function sampleFor(key: string, gender: Gender | null): string {
  if (key === 'narrador') return SAMPLE.narrador;
  const ch = CHARACTER_BY_ID[key as CharacterId];
  if (ch) return ch.ai.lines.entrar_cena?.[0] ?? SAMPLE[ch.gender];
  return SAMPLE[gender ?? 'm'];
}

export function VoiceSettings() {
  const { settings, setSettings } = useGame();
  const voice = useVoice();
  const vs = settings.voice;
  const engine = voice.mode === 'claude' ? 'claude' : 'navegador';
  const set = (patch: Partial<typeof vs>) => setSettings({ ...settings, voice: { ...vs, ...patch } });
  const setCast = (key: string, optionId: string) => set({ cast: { ...vs.cast, [engine]: { ...(vs.cast[engine] ?? {}), [key]: optionId } } });
  const optionsFor = (gender: Gender | null): VoiceOption[] => (gender ? voice.catalog.filter((o) => o.gender === gender) : voice.catalog);

  return (
    <>
      <label className="check"><input type="checkbox" checked={settings.autoNarrate} onChange={(e) => setSettings({ ...settings, autoNarrate: e.target.checked })} /> Ler automaticamente narrações e diálogos (em português do Brasil)</label>
      <label className="field">Velocidade geral da fala
        <select id="voice-rate" value={vs.rate} onChange={(e) => set({ rate: Number(e.target.value) })}>
          <option value={0.9}>Mais lenta</option>
          <option value={1}>Normal</option>
          <option value={1.1}>Mais rápida</option>
        </select>
      </label>

      <fieldset className="casting">
        <legend>Motor de voz</legend>
        <label className="radio"><input type="radio" name="engine" checked={engine === 'claude'} disabled={!voice.claudeAvailable} onChange={() => set({ engine: 'claude' })} /> Vozes do Claude{!voice.claudeAvailable && ' (indisponíveis aqui: só no claude.ai, fora do Safari e dos apps)'}</label>
        <label className="radio"><input type="radio" name="engine" checked={engine === 'navegador'} onChange={() => set({ engine: 'navegador' })} /> Vozes do navegador ({new Set(voice.catalog.filter((o) => o.engine === 'navegador').map((o) => o.base)).size || 'nenhuma'} em português neste aparelho)</label>
      </fieldset>

      <fieldset className="casting">
        <legend>Quem fala</legend>
        <label className="radio"><input type="radio" name="casting" checked={vs.casting === 'elenco'} onChange={() => set({ casting: 'elenco' })} /> Elenco: narrador, NPCs por gênero e uma voz para cada protagonista</label>
        <label className="radio"><input type="radio" name="casting" checked={vs.casting === 'narrador'} onChange={() => set({ casting: 'narrador' })} /> Um narrador lê tudo (audiolivro)</label>
      </fieldset>

      {engine === 'claude' && (
        <fieldset className="casting">
          <legend>Calibração das vozes do Claude</legend>
          <p className="small muted">O Claude não informa o timbre das quatro vozes. Ouça cada uma e marque se soa masculina ou feminina; o catálogo se ajusta.</p>
          <div className="calib-grid">
            {CLAUDE_VOICES.map((v) => (
              <div key={v} className="calib-row">
                <strong>{v}</strong>
                <button className="btn-small" onClick={() => voice.speakText(SAMPLE.narrador, `claude:${v}:normal`)}>Ouvir</button>
                <label className="radio"><input type="radio" name={`g-${v}`} checked={vs.claudeGenders[v] === 'm'} onChange={() => set({ claudeGenders: { ...vs.claudeGenders, [v]: 'm' as Gender }, cast: { ...vs.cast, claude: {} } })} /> masculina</label>
                <label className="radio"><input type="radio" name={`g-${v}`} checked={vs.claudeGenders[v] === 'f'} onChange={() => set({ claudeGenders: { ...vs.claudeGenders, [v]: 'f' as Gender }, cast: { ...vs.cast, claude: {} } })} /> feminina</label>
              </div>
            ))}
          </div>
          {(!CLAUDE_VOICES.some((v: Voice) => vs.claudeGenders[v] === 'm') || !CLAUDE_VOICES.some((v: Voice) => vs.claudeGenders[v] === 'f')) && (
            <p className="small warning">Marque ao menos uma voz masculina e uma feminina.</p>
          )}
        </fieldset>
      )}

      {vs.casting === 'elenco' && (
        <>
          <h3>Elenco</h3>
          <p className="small muted">Cada opção é uma voz base em três versões: normal, mais grave e pausada, ou mais viva e rápida. NPCs femininos usam a voz de “NPCs femininos”; masculinos, a de “NPCs masculinos”.</p>
          <div className="voice-grid">
            {CAST_ROLES.map((r) => (
              <label key={r.key} className="field">{r.label}
                <span className="row tight">
                  <select id={`cast-${r.key}`} value={voice.cast[r.key] ?? ''} onChange={(e) => setCast(r.key, e.target.value)}>
                    {optionsFor(r.gender).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  <button className="btn-small" onClick={() => voice.speakText(sampleFor(r.key, r.gender), voice.cast[r.key])}>Testar</button>
                </span>
              </label>
            ))}
          </div>
          <button className="btn-small" onClick={() => set({ cast: { ...vs.cast, [engine]: autoCast(voice.catalog) } })}>Restaurar elenco automático</button>
        </>
      )}
      {vs.casting === 'narrador' && (
        <label className="field">Voz do narrador
          <span className="row tight">
            <select id="cast-narrador" value={voice.cast.narrador ?? ''} onChange={(e) => setCast('narrador', e.target.value)}>
              {voice.catalog.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <button className="btn-small" onClick={() => voice.speakText(SAMPLE.narrador, voice.cast.narrador)}>Testar</button>
          </span>
        </label>
      )}
    </>
  );
}
