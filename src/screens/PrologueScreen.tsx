import { useEffect, useState } from 'react';
import { PROLOGUE, PROLOGUE_TITLE } from '../data/campaign/prologue';
import { useGame } from '../state/GameContext';
import { useVoice } from '../platform/voice';
import { SceneImage } from '../components/SceneImage';

export function PrologueScreen() {
  const { go } = useGame();
  const voice = useVoice();
  const [shown, setShown] = useState(1);
  const done = shown >= PROLOGUE.length;

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => setShown((n) => n + 1), 2600);
    return () => window.clearTimeout(t);
  }, [shown, done]);

  return (
    <main className="prologue-screen" onClick={() => setShown(PROLOGUE.length)}>
      <article className="prologue">
        <SceneImage slotId="cena_prologo" />
        <h1>{PROLOGUE_TITLE}</h1>
        {PROLOGUE.slice(0, shown).map((p, i) => (
          <p key={i} className={`${i === 0 ? 'dateline' : ''}${p.emphasis ? ' emphasis' : ''} fade-in`}>{p.text}</p>
        ))}
      </article>
      <div className="prologue-actions">
        {voice.mode !== 'nenhuma' && (
          <button onClick={(e) => { e.stopPropagation(); setShown(PROLOGUE.length); if (voice.speaking) voice.stop(); else voice.speakEntries(PROLOGUE.map((p, i) => ({ id: i, kind: 'texto', text: p.text, time: 0 }))); }}>
            {voice.speaking ? '■ Parar narração' : '▶ Ouvir o prólogo'}
          </button>
        )}
        {!done && <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); setShown(PROLOGUE.length); }}>Mostrar tudo</button>}
        <button className="btn-primary" disabled={!done} onClick={(e) => { e.stopPropagation(); go('selecao'); }}>Formar o grupo →</button>
        <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); go('menu'); }}>Voltar ao menu</button>
      </div>
    </main>
  );
}
