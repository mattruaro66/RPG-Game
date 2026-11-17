import { useEffect, useRef, useState } from 'react';
import { SceneImage } from '../components/SceneImage';
import { IMAGE_BY_ID } from '../data/images';
import { npcDisplayName } from '../engine/narrative/effects';
import { useVoice } from '../platform/voice';
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
  const { game, go, save, settings, setSettings } = useGame();
  const [sheet, setSheet] = useState<CharacterId | null>(null);
  const voice = useVoice();
  const lastSpoken = useRef<number | null>(null);

  // Narração automática: lê o que acabou de acontecer.
  useEffect(() => {
    if (!game) return;
    const last = game.narrative[game.narrative.length - 1]?.id ?? 0;
    if (lastSpoken.current === null) {
      // Ao abrir a tela, lê a cena atual (a partir do último título de cena).
      lastSpoken.current = last;
      if (!settings.autoNarrate) return;
      let start = game.narrative.length - 1;
      while (start > 0 && game.narrative[start].kind !== 'cena') start--;
      voice.speakEntries(game.narrative.slice(start).slice(0, 14));
      return;
    }
    if (last <= lastSpoken.current) return;
    const fresh = game.narrative.filter((e) => e.id > lastSpoken.current!);
    lastSpoken.current = last;
    if (settings.autoNarrate && !game.combat) voice.speakEntries(fresh);
  }, [game?.narrative, settings.autoNarrate]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="voice-controls" aria-label="Narração">
          {voice.mode !== 'nenhuma' && (
            <label className="check small" title={voice.mode === 'claude' ? 'Vozes do Claude' : 'Voz do navegador'}>
              <input type="checkbox" checked={settings.autoNarrate} onChange={(e) => { setSettings({ ...settings, autoNarrate: e.target.checked }); if (!e.target.checked) voice.stop(); }} />
              Narração
            </label>
          )}
          {voice.speaking && <button className="btn-small" onClick={voice.stop}>■ Parar áudio</button>}
          {voice.error && <span className="small warning">{voice.error}</span>}
        </div>
        <nav className="topbar-nav">
          <button className="btn-small" onClick={() => go('galeria')}>Galeria</button>
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
        {(() => {
          const slotId = game.visual ?? content().scenes[game.sceneId]?.image;
          const npc = slotId ? IMAGE_BY_ID[slotId]?.npc : undefined;
          return <SceneImage slotId={slotId} compact={!!game.combat} title={npc ? npcDisplayName(game, npc) : undefined} />;
        })()}
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
