import { useState } from 'react';
import { deleteSave, listSaves, SLOTS, SLOT_LABELS } from '../persistence/storage';
import { useGame } from '../state/GameContext';

export function LoadScreen() {
  const { go, load, save, game } = useGame();
  const [, refresh] = useState(0);
  const [confirming, setConfirming] = useState<string | null>(null);
  const saves = listSaves();
  return (
    <main className="doc-screen">
      <header className="doc-head">
        <button className="btn-ghost" onClick={() => go(game ? 'jogo' : 'menu')}>← Voltar</button>
        <h1>{game ? 'Salvar / Carregar' : 'Carregar Jogo'}</h1>
      </header>
      <div className="slots">
        {SLOTS.map((slot, i) => {
          const meta = saves[i];
          return (
            <article key={slot} className="paper-card slot">
              <h2>{SLOT_LABELS[slot]}</h2>
              {meta ? (
                <>
                  <p>{meta.summary}</p>
                  <p className="muted">Salvo em {new Date(meta.savedAt).toLocaleString('pt-BR')}</p>
                </>
              ) : <p className="muted">Vazio</p>}
              <div className="row">
                <button disabled={!meta} onClick={() => load(slot)}>Carregar</button>
                {game && slot !== 'auto' && <button onClick={() => { save(slot); refresh((n) => n + 1); }}>Salvar aqui</button>}
                {meta && slot !== 'auto' && confirming !== slot && <button className="btn-ghost" onClick={() => setConfirming(slot)}>Apagar</button>}
                {meta && confirming === slot && (
                  <>
                    <button className="btn-primary" onClick={() => { deleteSave(slot); setConfirming(null); refresh((n) => n + 1); }}>Confirmar exclusão</button>
                    <button className="btn-ghost" onClick={() => setConfirming(null)}>Cancelar</button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
