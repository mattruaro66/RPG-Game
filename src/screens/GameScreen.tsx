import { useState } from 'react';
import { Actions } from '../components/Actions';
import { CharacterSheet } from '../components/CharacterSheet';
import { CombatView } from '../components/Combat';
import { InfoTabs } from '../components/InfoTabs';
import { Narrative } from '../components/Narrative';
import { PartyPanel } from '../components/PartyPanel';
import { currentActorId } from '../engine/combat/combat';
import { content } from '../engine/narrative/registry';
import { formatClock, formatDate } from '../engine/time';
import type { CharacterId } from '../engine/types';
import { useGame } from '../state/GameContext';

export function GameScreen() {
  const { game, go, save, settings } = useGame();
  const [sheet, setSheet] = useState<CharacterId | null>(null);
  if (!game) return null;
  const scene = content().scenes[game.sceneId];
  const loc = content().locations[scene.location as keyof ReturnType<typeof content>['locations']];

  return (
    <div className="game-screen">
      <header className="topbar">
        <div className="topbar-title">
          <strong>Nova Iorque: 1992</strong>
          <span className="muted">{loc?.name}{loc ? ` · ${loc.district}` : ''}</span>
        </div>
        <div className="clock" aria-label="Data e hora">
          <span>{formatDate(game.time)}</span>
          <strong>{formatClock(game.time)}</strong>
        </div>
        <nav className="topbar-nav">
          <button className="btn-small" disabled={!!game.combat} onClick={() => save('slot1')}>Salvar</button>
          <button className="btn-small" onClick={() => go('carregar')}>Arquivos</button>
          <button className="btn-small" onClick={() => go('config')}>Config.</button>
          <button className="btn-small btn-ghost" onClick={() => go('menu')}>Menu</button>
        </nav>
      </header>

      <aside className="col-party">
        <PartyPanel game={game} onOpen={setSheet} activeId={currentActorId(game)} />
      </aside>

      <main className="col-main">
        {game.combat ? (
          <CombatView game={game} />
        ) : (
          <>
            <Narrative game={game} showDice={settings.showDiceDetails} />
            {game.gameOver ? (
              <div className="game-over paper-card">
                <h2>Fim</h2>
                <p>{game.gameOver.reason}</p>
                <button className="btn-primary" onClick={() => go('menu')}>Voltar ao menu</button>
              </div>
            ) : (
              <Actions game={game} />
            )}
          </>
        )}
      </main>

      <aside className="col-info">
        <InfoTabs game={game} />
      </aside>

      {sheet && <CharacterSheet id={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}
