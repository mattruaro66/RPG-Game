import { useEffect, useState } from 'react';
import { PROLOGUE, PROLOGUE_TITLE } from '../data/campaign/prologue';
import { useGame } from '../state/GameContext';

export function PrologueScreen() {
  const { go } = useGame();
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
        <h1>{PROLOGUE_TITLE}</h1>
        {PROLOGUE.slice(0, shown).map((p, i) => (
          <p key={i} className={`${i === 0 ? 'dateline' : ''}${p.emphasis ? ' emphasis' : ''} fade-in`}>{p.text}</p>
        ))}
      </article>
      <div className="prologue-actions">
        {!done && <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); setShown(PROLOGUE.length); }}>Mostrar tudo</button>}
        <button className="btn-primary" disabled={!done} onClick={(e) => { e.stopPropagation(); go('selecao'); }}>Formar o grupo →</button>
        <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); go('menu'); }}>Voltar ao menu</button>
      </div>
    </main>
  );
}
