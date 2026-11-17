import { useState } from 'react';
import { CHARACTER_BY_ID, shortName } from '../data/characters';
import { ITEM_BY_ID } from '../data/items';
import { CONSPIRACY_OVERVIEW, INTERNAL_NPCS } from '../data/campaign/internal';
import { capacity, LOCATION_LABELS, usedSlots } from '../engine/inventory';
import { canProvidePsychiatricHelp, canRecoverToday, isPlayable } from '../engine/sanity';
import { canTreat, TREATMENTS } from '../engine/medical';
import { content } from '../engine/narrative/registry';
import { activeParty } from '../engine/narrative/conditions';
import { TRACK_LABELS, type GameState, type TrackId } from '../engine/state';
import { dayIndex, formatClock, formatDate, formatDateTime } from '../engine/time';
import type { CharacterId } from '../engine/types';
import { addHypothesis, dailySanity, gmAdvanceTime, gmGrantXp, gmTrack, pickUp, psychiatry, removeHypothesis, treatOutOfCombat } from '../state/session';
import { useGame } from '../state/GameContext';
import { Tag } from './ui';
import { Thumb } from './SceneImage';

type TabId = 'diario' | 'objetivos' | 'inventario' | 'cuidados' | 'mapa' | 'dados' | 'mestre';

export function InfoTabs({ game }: { game: GameState }) {
  const { settings } = useGame();
  const [tab, setTab] = useState<TabId>('diario');
  const tabs: [TabId, string][] = [
    ['diario', 'Diário'],
    ['objetivos', 'Objetivos'],
    ['inventario', 'Inventário'],
    ['cuidados', 'Cuidados'],
    ['mapa', 'Mapa'],
    ['dados', 'Dados'],
    ...(settings.gmMode ? [['mestre', 'Mestre'] as [TabId, string]] : []),
  ];
  return (
    <section className="info-tabs">
      <nav className="tabbar" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      <div className="tab-body">
        {tab === 'diario' && <Journal game={game} />}
        {tab === 'objetivos' && <Objectives game={game} />}
        {tab === 'inventario' && <InventoryTab game={game} />}
        {tab === 'cuidados' && <CareTab game={game} />}
        {tab === 'mapa' && <MapTab game={game} />}
        {tab === 'dados' && <DiceTab game={game} />}
        {tab === 'mestre' && <GmTab game={game} />}
      </div>
    </section>
  );
}

const IMPORTANCE: Record<string, { label: string; tone: 'wine' | 'warn' | 'muted' }> = {
  essencial: { label: 'essencial', tone: 'wine' },
  importante: { label: 'importante', tone: 'warn' },
  secundaria: { label: 'secundária', tone: 'muted' },
};

function Journal({ game }: { game: GameState }) {
  const { update } = useGame();
  const c = content();
  const [draft, setDraft] = useState('');
  const [doc, setDoc] = useState<string | null>(null);
  const discovered = new Set(game.journal.clues.map((x) => x.id));
  const memoryHolders = new Set(game.party.filter((p) => p.bonuses.includes('memoria_fotografica')).map((p) => p.id));

  return (
    <div className="journal">
      <h3>Casos</h3>
      {game.journal.cases.length === 0 && <p className="muted small">Nenhum caso aberto.</p>}
      {game.journal.cases.map((k) => (
        <details key={k.id} className="case" open={k.status === 'ativo'}>
          <summary><strong>{c.cases[k.id].title}</strong> <Tag tone={k.status === 'ativo' ? 'wine' : 'muted'}>{k.status}</Tag></summary>
          <p className="small">{c.cases[k.id].summary}</p>
          <ul className="clue-list">
            {game.journal.clues.filter((cl) => c.clues[cl.id].caseId === k.id).map((cl) => {
              const def = c.clues[cl.id];
              const related = def.related.filter((r) => discovered.has(r));
              const showMemory = def.memoryDetail && cl.witnesses.some((w) => memoryHolders.has(w));
              return (
                <li key={cl.id} className="clue">
                  <Thumb slotId={def.image} alt={def.title} className="clue-thumb" />
                  <div className="clue-head"><strong>{def.title}</strong> <Tag tone={IMPORTANCE[def.importance].tone}>{IMPORTANCE[def.importance].label}</Tag></div>
                  <p>{def.description}</p>
                  {cl.extras.map((e) => <p key={e} className="clue-extra">+ {e}</p>)}
                  {showMemory && <p className="clue-memory">Memória Fotográfica: {def.memoryDetail}</p>}
                  {related.length > 0 && <p className="small muted">Relaciona-se com: {related.map((r) => c.clues[r].title).join(' · ')}</p>}
                  <p className="small muted">{c.locations[def.location as keyof typeof c.locations]?.name ?? def.location} · {formatDateTime(cl.time)}</p>
                </li>
              );
            })}
          </ul>
        </details>
      ))}

      <h3>Pessoas conhecidas</h3>
      <ul className="compact">
        {game.journal.people.map((id) => {
          const n = c.npcs[id];
          return <li key={id}><strong>{n.name}</strong> — {n.publicRole} <span className="muted small">{n.publicNotes}</span></li>;
        })}
      </ul>

      <h3>Documentos</h3>
      <ul className="compact">
        {game.journal.documents.map((id) => (
          <li key={id}><button className="link" onClick={() => setDoc(doc === id ? null : id)}>{c.documents[id].title}</button>
            {doc === id && <div className="document">{c.documents[id].content.map((l, i) => <p key={i}>{l}</p>)}</div>}
          </li>
        ))}
      </ul>

      <h3>Hipóteses</h3>
      <p className="muted small">Suas anotações. O jogo não confirma nem desmente.</p>
      <ul className="compact">
        {game.journal.hypotheses.map((h) => (
          <li key={h.id}>{h.text} <button className="btn-small btn-ghost" onClick={() => update((s) => removeHypothesis(s, h.id))}>remover</button></li>
        ))}
      </ul>
      <form className="row" onSubmit={(e) => { e.preventDefault(); update((s) => addHypothesis(s, draft)); setDraft(''); }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ex.: R.W. é Richard Whitmore?" aria-label="Nova hipótese" />
        <button type="submit" disabled={!draft.trim()}>Anotar</button>
      </form>

      <h3>Eventos e decisões</h3>
      <ul className="compact small">
        {[...game.journal.events.map((e) => ({ t: e.time, text: e.text })), ...game.decisions.map((d) => ({ t: d.time, text: `Decisão: ${d.label}` }))]
          .sort((a, b) => a.t - b.t)
          .map((e, i) => <li key={i}><span className="muted">{formatDate(e.t)}, {formatClock(e.t)}</span> — {e.text}</li>)}
      </ul>
    </div>
  );
}

function Objectives({ game }: { game: GameState }) {
  const c = content();
  const groups: ['ativo' | 'concluido' | 'falhou', string][] = [['ativo', 'Atuais'], ['concluido', 'Concluídos'], ['falhou', 'Fracassados']];
  return (
    <div>
      {groups.map(([st, label]) => {
        const list = game.journal.objectives.filter((o) => o.status === st);
        if (!list.length) return null;
        return (
          <div key={st}>
            <h3>{label}</h3>
            <ul className="objectives">{list.map((o) => <li key={o.id} className={`obj-${st}`}>{c.objectives[o.id]?.text} <span className="muted small">({c.cases[c.objectives[o.id]?.caseId]?.title})</span></li>)}</ul>
          </div>
        );
      })}
    </div>
  );
}

function InventoryTab({ game }: { game: GameState }) {
  const { update } = useGame();
  const ground = game.groundItems[game.sceneId] ?? [];
  const able = activeParty(game);
  return (
    <div>
      {game.party.map((c) => (
        <div key={c.id} className="inv-summary">
          <h4>{shortName(CHARACTER_BY_ID[c.id])}</h4>
          {(['hands', 'bag', 'pockets'] as const).map((loc) => (
            <p key={loc} className="small"><span className="muted">{LOCATION_LABELS[loc]} ({usedSlots(c.inventory, loc)}{Number.isFinite(capacity(loc)) ? `/${capacity(loc)}` : ''}):</span> {c.inventory[loc].map((i) => ITEM_BY_ID[i.itemId].name).join(', ') || '—'}</p>
          ))}
        </div>
      ))}
      <p className="muted small">Abra a ficha de um personagem (clique no retrato) para equipar, guardar, transferir ou descartar.</p>
      {ground.length > 0 && (
        <>
          <h3>No local</h3>
          {ground.map((i) => (
            <div key={i.uid} className="inv-item">
              <span>{ITEM_BY_ID[i.itemId].name}</span>
              <select className="btn-small" value="" onChange={(e) => e.target.value && update((s) => pickUp(s, i.uid, e.target.value as CharacterId))}>
                <option value="">Pegar…</option>
                {able.map((c) => <option key={c.id} value={c.id}>{shortName(CHARACTER_BY_ID[c.id])}</option>)}
              </select>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function CareTab({ game }: { game: GameState }) {
  const { update } = useGame();
  const day = dayIndex(game.time);
  const here = activeParty(game);
  const healers = here.filter((c) => c.status === 'ativo' && c.sanity > 0);
  const [healer, setHealer] = useState<CharacterId | ''>(healers.find((h) => h.specialties.some((s) => TREATMENTS[s]))?.id ?? healers[0]?.id ?? '');
  const h = game.party.find((c) => c.id === healer);
  const doctors = here.filter((c) => c.specialties.includes('psiquiatria'));
  if (game.combat) return <p className="muted">Durante o combate, use as ações de combate.</p>;
  return (
    <div>
      <h3>Tratamento médico</h3>
      <label className="field">Quem trata
        <select value={healer} onChange={(e) => setHealer(e.target.value as CharacterId)}>
          {healers.map((c) => <option key={c.id} value={c.id}>{shortName(CHARACTER_BY_ID[c.id])}</option>)}
        </select>
      </label>
      {h && Object.keys(TREATMENTS).map((sp) => (
        <div key={sp} className="care-row">
          <span className="small">{TREATMENTS[sp].label}{!h.specialties.includes(sp) && <span className="muted"> (sem especialidade)</span>}</span>
          <div className="row wrap">
            {here.filter((t) => t.status !== 'morto' && t.hp < t.maxHp).map((t) => {
              const ok = canTreat(h, t, sp);
              return <button key={t.id} className="btn-small" disabled={!ok.ok} title={ok.reason} onClick={() => update((s) => treatOutOfCombat(s, h.id, t.id, sp))}>{shortName(CHARACTER_BY_ID[t.id])} ({t.hp} PV)</button>;
            })}
          </div>
        </div>
      ))}
      {game.party.every((t) => t.hp >= t.maxHp || t.status === 'morto') && <p className="muted small">Ninguém está ferido.</p>}

      <h3>Sanidade — recuperação diária</h3>
      <p className="muted small">Um teste de Espírito (D6) por personagem por dia. Hoje: {formatDate(game.time)}.</p>
      <div className="row wrap">
        {game.party.filter(isPlayable).map((c) => (
          <button key={c.id} className="btn-small" disabled={!canRecoverToday(c, day)} onClick={() => update((s) => dailySanity(s, c.id))}>
            {shortName(CHARACTER_BY_ID[c.id])} ({c.sanity}/10)
          </button>
        ))}
      </div>

      {doctors.length > 0 && (
        <>
          <h3>Psiquiatria</h3>
          {doctors.map((d) => {
            const can = canProvidePsychiatricHelp(d, day);
            return (
              <div key={d.id}>
                {!can.ok && <p className="muted small">{shortName(CHARACTER_BY_ID[d.id])}: {can.reason}</p>}
                <div className="row wrap">
                  {here.filter((t) => t.id !== d.id && isPlayable(t) && t.sanity < 10).map((t) => (
                    <button key={t.id} className="btn-small" disabled={!can.ok} onClick={() => update((s) => psychiatry(s, d.id, t.id))}>
                      {shortName(CHARACTER_BY_ID[d.id])} → {shortName(CHARACTER_BY_ID[t.id])} ({t.sanity}/10)
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function MapTab({ game }: { game: GameState }) {
  const c = content();
  const visited = game.journal.locations.map((id) => c.locations[id as keyof typeof c.locations]).filter(Boolean);
  const districts = [...new Set(visited.map((l) => l.district))];
  const current = c.scenes[game.sceneId].location;
  return (
    <div className="map">
      <p className="muted small">Locais visitados. Novos lugares aparecem conforme a investigação avança.</p>
      {districts.map((d) => (
        <div key={d} className="district">
          <h4>{d}</h4>
          <ul className="compact">{visited.filter((l) => l.district === d).map((l) => <li key={l.id}>{l.id === current ? '● ' : ''}<strong>{l.name}</strong> — <span className="small">{l.description}</span></li>)}</ul>
        </div>
      ))}
      {game.journal.clues.some((x) => x.id === 'fosforos_nocturne') && (
        <div className="district"><h4>Lower East Side</h4><ul className="compact"><li><strong>Nocturne</strong> — <span className="small muted">Ludlow St. Ainda não visitado.</span></li></ul></div>
      )}
    </div>
  );
}

function DiceTab({ game }: { game: GameState }) {
  return (
    <div className="dice-log">
      {game.diceLog.length === 0 && <p className="muted small">Nenhuma rolagem ainda.</p>}
      {[...game.diceLog].reverse().map((d) => (
        <article key={d.id} className={`dice-entry out-${d.outcome.toLowerCase().split(' ')[0]}`}>
          <pre className="dice-lines">{d.lines.join('\n')}</pre>
        </article>
      ))}
    </div>
  );
}

function GmTab({ game }: { game: GameState }) {
  const { update } = useGame();
  return (
    <div className="gm">
      <p className="warning">Camada interna da campanha — não mostre aos jogadores.</p>
      <h3>Estados da conspiração</h3>
      {(Object.keys(TRACK_LABELS) as TrackId[]).map((t) => (
        <div key={t} className="track-row">
          <span>{TRACK_LABELS[t]}</span>
          <strong>{game.internal.tracks[t]}</strong>
          <button className="btn-small" onClick={() => update((s) => gmTrack(s, t, -1))}>−</button>
          <button className="btn-small" onClick={() => update((s) => gmTrack(s, t, 1))}>+</button>
        </div>
      ))}
      <p className="small">Atenção das facções: {Object.entries(game.internal.factionAttention).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'}</p>
      <p className="small">Conhecimento sobre vampiros: {game.internal.vampireKnowledge}</p>
      <h3>Narrador</h3>
      <div className="row wrap">
        <button className="btn-small" onClick={() => update((s) => gmGrantXp(s, 'todos', 5))}>+5 XP ao grupo</button>
        <button className="btn-small" onClick={() => update((s) => gmAdvanceTime(s, 60))}>Avançar 1 hora</button>
        <button className="btn-small" onClick={() => update((s) => gmAdvanceTime(s, 1440))}>Avançar 1 dia</button>
      </div>
      <h3>Notas internas</h3>
      <ul className="compact small">{CONSPIRACY_OVERVIEW.map((l) => <li key={l}>{l}</li>)}</ul>
      {INTERNAL_NPCS.map((n) => (
        <details key={n.npcId}><summary>{content().npcs[n.npcId]?.name} <Tag tone="muted">{n.status}</Tag></summary>
          <ul className="compact small">{[...n.realGoals, ...n.secrets, ...n.knowledge].map((l) => <li key={l}>{l}</li>)}</ul>
        </details>
      ))}
      <h3>Flags</h3>
      <pre className="dice-lines small">{JSON.stringify(game.flags, null, 1)}</pre>
    </div>
  );
}
