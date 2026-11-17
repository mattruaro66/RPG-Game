import { CANONICAL } from '../config/rules';
import { BONUS_BY_ID } from '../data/bonuses';
import { CHARACTER_BY_ID, displayName, shortName } from '../data/characters';
import { ITEM_BY_ID, type StorageLocation } from '../data/items';
import { SPECIALTY_BY_ID } from '../data/specialties';
import { characterLimit } from '../engine/character';
import { damageFormula } from '../engine/damage';
import { capacity, LOCATION_LABELS, usedSlots } from '../engine/inventory';
import { improvementsAvailable, xpToNext } from '../engine/progression';
import { SANITY_LABELS, sanityState } from '../engine/sanity';
import type { GameState } from '../engine/state';
import { ATTRIBUTE_IDS, ATTRIBUTE_LABELS, PROFESSION_LABELS, type CharacterId } from '../engine/types';
import { dropItem, moveItem, setControl, transferItem } from '../state/session';
import { useGame } from '../state/GameContext';
import { activeParty, isPresent } from '../engine/narrative/conditions';
import { statusLabel } from './PartyPanel';
import { Bar, Modal, Portrait, Tag } from './ui';

export function CharacterSheet({ id, onClose }: { id: CharacterId; onClose: () => void }) {
  const { game, update } = useGame();
  if (!game) return null;
  const c = game.party.find((p) => p.id === id)!;
  const def = CHARACTER_BY_ID[id];
  const st = statusLabel(c);
  const here = isPresent(game, id);
  const others = here ? activeParty(game).filter((p) => p.id !== id) : [];
  const locked = !!game.combat;

  return (
    <Modal title="Ficha do personagem" onClose={onClose} wide>
      <div className="sheet">
        <header className="sheet-head">
          <Portrait id={id} size={90} />
          <div>
            <h2>{displayName(def)}</h2>
            <p className="dossier-prof">{PROFESSION_LABELS[c.profession]} · {def.age} anos · {def.occupation}</p>
            <p><em>{def.personality}</em></p>
            <Tag tone={st.tone}>{st.text}</Tag>
            <div className="control-pick">
              <span>Controle:</span>
              <label className="radio"><input type="radio" checked={c.control === 'jogador'} onChange={() => update((s) => setControl(s, id, 'jogador'))} /> Jogador</label>
              <label className="radio"><input type="radio" checked={c.control === 'ia'} onChange={() => update((s) => setControl(s, id, 'ia'))} /> IA</label>
            </div>
          </div>
          <div className="sheet-vitals">
            <Bar value={c.hp} max={c.maxHp} kind="hp" label={`PV ${c.hp}/${c.maxHp}`} />
            <Bar value={c.sanity} max={10} kind="san" label={`Sanidade ${c.sanity}/10 · ${SANITY_LABELS[sanityState(c.sanity)]}`} />
            <p>XP: <strong>{c.xp}</strong> · próxima melhoria em {xpToNext(c)} XP</p>
            <p>Melhorias disponíveis: <strong>{improvementsAvailable(c)}</strong> <Tag tone="warn" title="O destino do +1 ainda aguarda decisão do criador (P-16)">pendente</Tag></p>
          </div>
        </header>

        <div className="sheet-cols">
          <section>
            <h3>Atributos</h3>
            <table className="table attrs">
              <tbody>
                {ATTRIBUTE_IDS.map((a) => (
                  <tr key={a}><td>{ATTRIBUTE_LABELS[a]}</td><td className="num">{c.attributes[a]}</td><td className="muted">D6 ≤ {c.attributes[a]}</td></tr>
                ))}
              </tbody>
            </table>

            <h3>Especialidades</h3>
            <ul className="compact">
              {c.specialties.map((sp) => {
                const sd = SPECIALTY_BY_ID[sp];
                const b = characterLimit(c, { attribute: sd.suggestedAttribute, specialty: sp });
                return <li key={sp}><strong>{sd.name}</strong> <span className="muted">({ATTRIBUTE_LABELS[sd.suggestedAttribute]} + 10 = limite {b.limit})</span><br /><small>{sd.description}</small></li>;
              })}
            </ul>

            <h3>Bônus</h3>
            <ul className="compact">
              {c.bonuses.map((b) => {
                const bd = BONUS_BY_ID[b];
                return <li key={b}><strong>{bd.name}</strong>: {bd.description}{bd.onus && <><br /><small className="onus">Ônus: {bd.onus.description}</small></>}</li>;
              })}
            </ul>
          </section>

          <section>
            <h3>Equipamento</h3>
            {(['hands', 'bag', 'pockets'] as StorageLocation[]).map((loc) => {
              const cap = capacity(loc);
              return (
                <div key={loc} className="inv-loc">
                  <h4>{LOCATION_LABELS[loc]} <span className="muted">{Number.isFinite(cap) ? `${usedSlots(c.inventory, loc)}/${cap} espaços` : `${c.inventory[loc].length} objetos pequenos`}</span></h4>
                  {c.inventory[loc].length === 0 && <p className="muted small">—</p>}
                  {c.inventory[loc].map((inst) => {
                    const it = ITEM_BY_ID[inst.itemId];
                    return (
                      <div key={inst.uid} className="inv-item">
                        <div>
                          <strong>{it.name}</strong> {it.slots > 1 && <Tag tone="muted">{it.slots} espaços</Tag>}
                          {it.weapon && <Tag tone="wine">{damageFormula(it.weapon.damageType)}</Tag>}
                          <br /><small className="muted">{it.description}</small>
                        </div>
                        <div className="inv-actions">
                          {(['hands', 'bag', 'pockets'] as StorageLocation[]).filter((l) => l !== loc && it.allowed.includes(l)).map((l) => (
                            <button key={l} disabled={locked} className="btn-small" onClick={() => update((s) => moveItem(s, id, inst.uid, l))}>→ {LOCATION_LABELS[l]}</button>
                          ))}
                          {others.length > 0 && (
                            <select disabled={locked} className="btn-small" value="" onChange={(e) => e.target.value && update((s) => transferItem(s, id, inst.uid, e.target.value as CharacterId))}>
                              <option value="">Entregar a…</option>
                              {others.map((o) => <option key={o.id} value={o.id}>{shortName(CHARACTER_BY_ID[o.id])}</option>)}
                            </select>
                          )}
                          <button disabled={locked} className="btn-small btn-ghost" onClick={() => update((s) => dropItem(s, id, inst.uid))}>Descartar</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <p className="muted small">Mãos: {CANONICAL.handsCapacity} espaços · Bolsa: {CANONICAL.bagCapacity} · Bolsos: objetos pequenos.</p>

            <h3>Histórico</h3>
            <p className="small">{def.background}</p>
            {game.decisions.length > 0 && (
              <ul className="compact small">{game.decisions.map((d) => <li key={d.id + d.time}>{d.label}</li>)}</ul>
            )}
          </section>
        </div>
      </div>
    </Modal>
  );
}

export type { GameState };
