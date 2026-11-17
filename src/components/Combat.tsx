import { useEffect, useState } from 'react';
import { CHARACTER_BY_ID, shortName } from '../data/characters';
import { ITEM_BY_ID, UNARMED } from '../data/items';
import { specialtyName } from '../data/specialties';
import { combatantName, currentActorId, eligibleHelpers, isAble, isEnemy, partyMember, RESULT_LABELS, type CombatAction } from '../engine/combat/combat';
import { DAMAGE_TABLE, damageFormula } from '../engine/damage';
import { canTreat, TREATMENTS } from '../engine/medical';
import { content } from '../engine/narrative/registry';
import type { GameState } from '../engine/state';
import type { CharacterId } from '../engine/types';
import { combatAction, combatAiStep, finishCombat, isAiTurn } from '../state/session';
import { useGame } from '../state/GameContext';
import { Bar, Portrait, Tag } from './ui';

type Mode = null | 'atacar' | 'tratar' | 'item';

export function CombatView({ game }: { game: GameState }) {
  const { update, settings } = useGame();
  const cb = game.combat!;
  const actorId = currentActorId(game);
  const aiTurn = isAiTurn(game);
  const [mode, setMode] = useState<Mode>(null);
  const [weaponUid, setWeaponUid] = useState<string | null>(null);
  const [helpers, setHelpers] = useState<CharacterId[]>([]);
  const enc = content().encounters[cb.encounterId];

  useEffect(() => {
    setMode(null);
    setHelpers([]);
    const me = actorId ? partyMember(game, actorId) : undefined;
    setWeaponUid(me?.inventory.hands.find((i) => ITEM_BY_ID[i.itemId]?.weapon)?.uid ?? null);
  }, [actorId, cb.round]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!aiTurn || cb.result) return;
    const t = window.setTimeout(() => update(combatAiStep), settings.aiTurnDelayMs);
    return () => window.clearTimeout(t);
  }, [aiTurn, cb.result, actorId, cb.round, cb.log.length, settings.aiTurnDelayMs, update]);

  const act = (a: CombatAction) => update((s) => combatAction(s, a));
  const me = actorId && !isEnemy(game, actorId) ? partyMember(game, actorId) : undefined;
  const enemiesUp = Object.values(cb.enemies).filter((e) => isAble(game, e.uid));
  const treatSpecs = me ? me.specialties.filter((sp) => TREATMENTS[sp]) : [];
  const allTreat = Object.keys(TREATMENTS);
  const storedWeapons = me ? me.inventory.bag.filter((i) => ITEM_BY_ID[i.itemId]?.weapon) : [];

  return (
    <div className="combat">
      <header className="combat-head">
        <h2>{enc.title}</h2>
        <span className="muted">Rodada {cb.round}</span>
      </header>

      <ol className="initiative">
        {cb.order.map((id) => {
          const enemy = cb.enemies[id];
          const pc = partyMember(game, id);
          const c = cb.combatants[id];
          const out = !isAble(game, id);
          return (
            <li key={id} className={`init-item${id === actorId ? ' current' : ''}${out ? ' out' : ''}${cb.acted.includes(id) ? ' acted' : ''}${enemy ? ' enemy' : ''}`}>
              {pc ? <Portrait id={pc.id} size={28} dim={out} /> : <span className="enemy-icon" aria-hidden>✕</span>}
              <div>
                <strong>{combatantName(game, id)}</strong> <span className="muted">({c.initiative})</span>
                <Bar value={pc ? pc.hp : enemy.hp} max={pc ? pc.maxHp : enemy.maxHp} kind="hp" label={`PV ${pc ? pc.hp : enemy.hp}`} />
                <div className="row tight">
                  {c.inCover && <Tag tone="ok">cobertura</Tag>}
                  {c.defending && <Tag tone="ok">defendendo</Tag>}
                  {c.fled && <Tag tone="muted">fugiu</Tag>}
                  {pc?.status === 'portas_da_morte' && <Tag tone="wine">Às Portas da Morte</Tag>}
                  {pc?.status === 'morto' && <Tag tone="muted">morto</Tag>}
                  {enemy && enemy.status !== 'ativo' && <Tag tone="muted">{enemy.status.replace('_', ' ')}</Tag>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {cb.result ? (
        <div className="combat-end paper-card">
          <h3>Fim do combate</h3>
          <p>{RESULT_LABELS[cb.result].replace(/^./, (m) => m.toUpperCase())}.</p>
          <button className="btn-primary" onClick={() => update(finishCombat)}>Continuar</button>
        </div>
      ) : aiTurn ? (
        <div className="combat-wait"><p>Vez de <strong>{actorId && combatantName(game, actorId)}</strong>{actorId && !isEnemy(game, actorId) ? ' (IA)' : ''}…</p></div>
      ) : me ? (
        <div className="combat-actions">
          <p>Vez de <strong>{shortName(CHARACTER_BY_ID[me.id])}</strong>. Escolha uma ação:</p>
          {mode === null && (
            <div className="option-list grid">
              <button className="option" disabled={!enemiesUp.length} onClick={() => setMode('atacar')}>Atacar</button>
              <button className="option" onClick={() => act({ type: 'defender' })}>Defender-se / esquivar</button>
              <button className="option" onClick={() => act({ type: 'cobertura' })}>Procurar cobertura</button>
              <button className="option" onClick={() => setMode('tratar')}>Prestar atendimento médico</button>
              <button className="option" disabled={!storedWeapons.length} onClick={() => setMode('item')}>Utilizar item</button>
              {enc.environment.filter((e) => !cb.interactionsUsed.includes(e.id)).map((e) => (
                <button key={e.id} className="option" onClick={() => act({ type: 'ambiente', interactionId: e.id })}>{e.label}</button>
              ))}
              <button className="option" onClick={() => act({ type: 'fugir' })}>Tentar fugir</button>
            </div>
          )}
          {mode === 'atacar' && (
            <div className="sub-panel">
              <label className="field">Arma
                <select value={weaponUid ?? ''} onChange={(e) => setWeaponUid(e.target.value || null)}>
                  <option value="">Desarmado ({damageFormula(UNARMED.damageType)})</option>
                  {me.inventory.hands.filter((i) => ITEM_BY_ID[i.itemId]?.weapon).map((i) => {
                    const it = ITEM_BY_ID[i.itemId];
                    return <option key={i.uid} value={i.uid}>{it.name} ({DAMAGE_TABLE[it.weapon!.damageType].label}, {damageFormula(it.weapon!.damageType)} · {specialtyName(it.weapon!.specialty)})</option>;
                  })}
                </select>
              </label>
              <p className="small strong">Cooperação (opcional, até 2 — teste de Reflexo D6 de cada ajudante)</p>
              <div className="row wrap">
                {eligibleHelpers(game, me.id).map((h) => {
                  const on = helpers.includes(h);
                  return (
                    <label key={h} className="check">
                      <input type="checkbox" checked={on} disabled={!on && helpers.length >= 2} onChange={() => setHelpers((x) => (on ? x.filter((y) => y !== h) : [...x, h]))} />
                      {shortName(CHARACTER_BY_ID[h])}
                    </label>
                  );
                })}
              </div>
              <p className="small strong">Alvo</p>
              <div className="option-list">
                {enemiesUp.map((e) => (
                  <button key={e.uid} className="option" onClick={() => act({ type: 'atacar', targetId: e.uid, weaponUid, helperIds: helpers })}>{e.name} — PV {e.hp}/{e.maxHp}</button>
                ))}
              </div>
              <button className="btn-ghost" onClick={() => setMode(null)}>← Voltar</button>
            </div>
          )}
          {mode === 'tratar' && (
            <div className="sub-panel">
              {(treatSpecs.length ? treatSpecs : allTreat).map((sp) => (
                <div key={sp}>
                  <p className="small strong">{TREATMENTS[sp].label}{!me.specialties.includes(sp) && ' (sem a especialidade: apenas o atributo)'}</p>
                  <div className="option-list">
                    {game.party.filter((t) => t.status !== 'morto').map((t) => {
                      const ok = canTreat(me, t, sp);
                      return (
                        <button key={t.id} className="option" disabled={!ok.ok} title={ok.reason} onClick={() => act({ type: 'tratar', targetId: t.id, specialty: sp })}>
                          {shortName(CHARACTER_BY_ID[t.id])} — PV {t.hp}/{t.maxHp}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button className="btn-ghost" onClick={() => setMode(null)}>← Voltar</button>
            </div>
          )}
          {mode === 'item' && (
            <div className="sub-panel">
              <p className="small">Empunhar uma arma guardada consome o turno.</p>
              <div className="option-list">
                {storedWeapons.map((i) => (
                  <button key={i.uid} className="option" onClick={() => act({ type: 'usar_item', itemUid: i.uid })}>Empunhar {ITEM_BY_ID[i.itemId].name}</button>
                ))}
              </div>
              <button className="btn-ghost" onClick={() => setMode(null)}>← Voltar</button>
            </div>
          )}
        </div>
      ) : null}

      <div className="combat-log">
        <h4>Histórico do combate</h4>
        <ol>{cb.log.slice(-12).map((l, i) => <li key={i}>{l}</li>)}</ol>
      </div>
    </div>
  );
}
