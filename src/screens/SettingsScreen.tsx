import { useGame } from '../state/GameContext';
import { PROVISIONAL } from '../config/rules';
import { Tag } from '../components/ui';
import { VOICES, VOICE_ROLES, useVoice } from '../platform/voice';
import type { Voice } from '../platform/claude';

export function SettingsScreen() {
  const { go, settings, setSettings, game } = useGame();
  const voice = useVoice();
  return (
    <main className="doc-screen">
      <header className="doc-head">
        <button className="btn-ghost" onClick={() => go(game ? 'jogo' : 'menu')}>← Voltar</button>
        <h1>Configurações</h1>
      </header>
      <div className="rules">
        <section className="paper-card">
          <h2>Jogo</h2>
          <label className="check"><input type="checkbox" checked={settings.showDiceDetails} onChange={(e) => setSettings({ ...settings, showDiceDetails: e.target.checked })} /> Mostrar detalhes das rolagens na narrativa</label>
          <label className="check"><input type="checkbox" checked={settings.autosave} onChange={(e) => setSettings({ ...settings, autosave: e.target.checked })} /> Salvamento automático</label>
          <label className="field">Velocidade dos turnos da IA em combate
            <select value={settings.aiTurnDelayMs} onChange={(e) => setSettings({ ...settings, aiTurnDelayMs: Number(e.target.value) })}>
              <option value={250}>Rápida</option>
              <option value={700}>Normal</option>
              <option value={1400}>Lenta</option>
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={settings.gmMode} onChange={(e) => setSettings({ ...settings, gmMode: e.target.checked })} /> Modo Mestre <Tag tone="wine">revela informações ocultas</Tag></label>
          <p className="muted">O Modo Mestre mostra a camada interna da campanha (estados da conspiração, notas secretas) e permite conceder XP e avançar o tempo. Use apenas se houver um mestre humano.</p>
        </section>
        <section className="paper-card">
          <h2>Narração e vozes</h2>
          <label className="check"><input type="checkbox" checked={settings.autoNarrate} onChange={(e) => setSettings({ ...settings, autoNarrate: e.target.checked })} /> Ler automaticamente narrações e diálogos (em português do Brasil)</label>
          <label className="field">Velocidade da fala
            <select id="voice-rate" value={settings.voiceRate} onChange={(e) => setSettings({ ...settings, voiceRate: Number(e.target.value) })}>
              <option value={0.85}>Lenta</option>
              <option value={1}>Normal</option>
              <option value={1.15}>Rápida</option>
            </select>
          </label>

          <fieldset className="casting">
            <legend>Motor de voz</legend>
            <label className="radio"><input type="radio" name="engine" checked={settings.voiceEngine === 'claude'} disabled={!voice.claudeAvailable} onChange={() => setSettings({ ...settings, voiceEngine: 'claude' })} /> Vozes do Claude{!voice.claudeAvailable && ' (indisponíveis aqui: só no claude.ai, fora do Safari e dos apps)'}</label>
            <label className="radio"><input type="radio" name="engine" checked={settings.voiceEngine === 'navegador' || !voice.claudeAvailable} onChange={() => setSettings({ ...settings, voiceEngine: 'navegador' })} /> Vozes do navegador</label>
            <p className="small muted">
              {voice.browserVoices.male || voice.browserVoices.female
                ? `No navegador: voz masculina ${voice.browserVoices.male ?? '— (aproximada pelo tom)'}, voz feminina ${voice.browserVoices.female ?? '— (aproximada pelo tom)'}.`
                : 'Este navegador não informa vozes em português; o tom é ajustado para diferenciar homens e mulheres.'}{' '}
              Em pt-BR as vozes do Claude podem soar parecidas; se homens e mulheres soarem iguais, use as vozes do navegador.
            </p>
          </fieldset>

          <fieldset className="casting">
            <legend>Quem fala</legend>
            <label className="radio"><input type="radio" name="casting" checked={settings.voiceCasting === 'genero'} onChange={() => setSettings({ ...settings, voiceCasting: 'genero' })} /> Narrador, uma voz masculina para os homens e uma feminina para as mulheres</label>
            <label className="radio"><input type="radio" name="casting" checked={settings.voiceCasting === 'narrador'} onChange={() => setSettings({ ...settings, voiceCasting: 'narrador' })} /> Um narrador lê tudo (audiolivro)</label>
            <label className="radio"><input type="radio" name="casting" checked={settings.voiceCasting === 'personagens'} onChange={() => setSettings({ ...settings, voiceCasting: 'personagens' })} /> Escolher uma voz para cada personagem</label>
          </fieldset>

          {settings.voiceEngine === 'claude' && voice.claudeAvailable && (
            <>
              <p className="small muted">As quatro vozes do Claude não têm timbre informado. Ouça com “Testar” e ajuste se alguma não combinar.</p>
              <div className="voice-grid">
                {(settings.voiceCasting === 'personagens'
                  ? VOICE_ROLES
                  : settings.voiceCasting === 'genero'
                    ? [{ key: 'narrador', label: 'Narrador' }, { key: 'masculino', label: 'Voz masculina (homens)' }, { key: 'feminino', label: 'Voz feminina (mulheres)' }]
                    : [{ key: 'narrador', label: 'Narrador' }]
                ).map((r) => (
                  <label key={r.key} className="field">{r.label}
                    <span className="row tight">
                      <select id={`voice-${r.key}`} value={settings.voices[r.key] ?? 'rounded'} onChange={(e) => setSettings({ ...settings, voices: { ...settings.voices, [r.key]: e.target.value as Voice } })}>
                        {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                      </select>
                      <button className="btn-small" onClick={() => voice.speakText('Nova Iorque, primeiro de dezembro de mil novecentos e noventa e dois. A cidade nunca dorme.', r.key)}>Testar</button>
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
          {(settings.voiceEngine === 'navegador' || !voice.claudeAvailable) && voice.mode !== 'nenhuma' && (
            <div className="row wrap">
              <button className="btn-small" onClick={() => voice.speakText('Nova Iorque, primeiro de dezembro de mil novecentos e noventa e dois.', 'narrador')}>Testar narrador</button>
              <button className="btn-small" onClick={() => voice.speakText('Você vai falar agora, ou vai falar com a polícia depois.', 'masculino')}>Testar voz masculina</button>
              <button className="btn-small" onClick={() => voice.speakText('Preciso que encontre um homem.', 'feminino')}>Testar voz feminina</button>
            </div>
          )}
        </section>
        <section className="paper-card">
          <h2>Regras provisórias configuráveis</h2>
          <label className="field">Dano mínimo para resultados negativos (P-01)
            <select value={settings.minDamage} onChange={(e) => setSettings({ ...settings, minDamage: Number(e.target.value) as 0 | 1 })}>
              <option value={0}>0 (pode não causar dano)</option>
              <option value={1}>1 (sempre causa ao menos 1)</option>
            </select>
          </label>
          <label className="field">Quando bônus e ônus disparam juntos (P-02)
            <select value={settings.bonusOnusConflict} onChange={(e) => setSettings({ ...settings, bonusOnusConflict: e.target.value as typeof settings.bonusOnusConflict })}>
              <option value="onus_prevalece">O ônus prevalece (+8)</option>
              <option value="bonus_prevalece">O bônus prevalece (+15)</option>
              <option value="apenas_especialidade">Nenhum dos dois (+10)</option>
            </select>
          </label>
          <h3>Outros parâmetros provisórios (somente leitura)</h3>
          <ul className="compact">
            <li>Tratamento exige teste D20 de Raciocínio + especialidade: {PROVISIONAL.treatmentRequiresTest ? 'sim' : 'não'} (P-06)</li>
            <li>Crítico de arma de fogo mata protagonistas: {PROVISIONAL.firearmCritKillsProtagonists ? 'sim' : 'não'} (P-09)</li>
            <li>Defesa/esquiva e cobertura: teste D6 de Reflexo (P-11, P-12)</li>
            <li>Fuga: D20 Reflexo + Evasão, ou D6 de Reflexo sem a especialidade (P-13)</li>
            <li>Cooperação: vale o melhor resultado entre os participantes (P-14)</li>
            <li>Gasto de melhorias de XP: {PROVISIONAL.progressionSpendingEnabled ? 'habilitado' : 'aguardando decisão'} (P-16)</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
