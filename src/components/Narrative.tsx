import { useEffect, useRef } from 'react';
import type { GameState, NarrativeEntry } from '../engine/state';
import { useVoice } from '../platform/voice';

function Replay({ entry }: { entry: NarrativeEntry }) {
  const voice = useVoice();
  if (voice.mode === 'nenhuma') return null;
  return (
    <button className="replay" onClick={() => voice.speakEntries([entry])} aria-label="Ouvir este trecho" title="Ouvir">
      ▶
    </button>
  );
}

export function Narrative({ game, showDice }: { game: GameState; showDice: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = game.narrative[game.narrative.length - 1]?.id;
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [last]);

  return (
    <div className="narrative" ref={ref} aria-live="polite">
      {game.narrative.map((e) => {
        if (e.kind === 'teste' && !showDice) return null;
        if (e.kind === 'cena') return <h2 key={e.id} className="n-scene">{e.text}</h2>;
        if (e.kind === 'fala')
          return (
            <p key={e.id} className="n-speech">
              <span className="n-speaker">{e.speaker}</span> {e.text.startsWith('—') ? e.text : `— ${e.text}`} <Replay entry={e} />
            </p>
          );
        if (e.kind === 'ia')
          return (
            <p key={e.id} className="n-ai">
              <span className="n-speaker">{e.speaker}</span> {e.speaker === 'Narrador' ? e.text : `“${e.text}”`} <Replay entry={e} />
            </p>
          );
        if (e.kind === 'texto' || e.kind === 'perigo')
          return (
            <p key={e.id} className={`n-${e.kind}`}>
              {e.text} <Replay entry={e} />
            </p>
          );
        return <p key={e.id} className={`n-${e.kind}`}>{e.text}</p>;
      })}
    </div>
  );
}
