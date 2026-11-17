import { CHARACTER_BY_ID, shortName } from '../data/characters';
import { SANITY_LABELS, sanityState, isPlayable } from '../engine/sanity';
import type { GameState } from '../engine/state';
import type { CharacterId } from '../engine/types';
import { PROFESSION_LABELS } from '../engine/types';
import { Bar, Portrait, Tag } from './ui';
import { isPresent } from '../engine/narrative/conditions';
import { content } from '../engine/narrative/registry';

export function statusLabel(c: GameState['party'][number]): { text: string; tone: 'ok' | 'warn' | 'wine' | 'muted' } {
  if (c.status === 'morto') return { text: 'Morto', tone: 'muted' };
  if (c.sanity <= 0) return { text: 'Loucura irreversível', tone: 'muted' };
  if (c.status === 'portas_da_morte') return { text: 'Às Portas da Morte', tone: 'wine' };
  const st = sanityState(c.sanity);
  if (st !== 'sao') return { text: SANITY_LABELS[st], tone: 'warn' };
  return { text: 'Funcional', tone: 'ok' };
}

export function PartyPanel({ game, onOpen, activeId }: { game: GameState; onOpen: (id: CharacterId) => void; activeId?: string | null }) {
  return (
    <section className="party-panel" aria-label="Grupo">
      {game.party.map((c) => {
        const def = CHARACTER_BY_ID[c.id];
        const st = statusLabel(c);
        const here = isPresent(game, c.id);
        return (
          <button key={c.id} className={`party-card${activeId === c.id ? ' active' : ''}${!isPlayable(c) ? ' out' : ''}${!here ? ' away' : ''}`} onClick={() => onOpen(c.id)}>
            <Portrait id={c.id} size={44} dim={!isPlayable(c) || !here} />
            <div className="party-info">
              <div className="party-name">
                <strong>{shortName(def)}</strong>
                <span className="muted">{PROFESSION_LABELS[c.profession]}</span>
                {c.control === 'ia' && <Tag tone="muted" title="Controlado pela IA">IA</Tag>}
              </div>
              <Bar value={c.hp} max={c.maxHp} kind="hp" label={`PV ${c.hp}/${c.maxHp}`} />
              <Bar value={c.sanity} max={10} kind="san" label={`Sanidade ${c.sanity}/10`} />
              <Tag tone={st.tone}>{st.text}</Tag>
              {!here && isPlayable(c) && <Tag tone="muted" title="Fora da cena. Pode ser chamado por telefone.">{game.travel?.savedPresent?.includes(c.id) ? 'Em outra cena · com o grupo' : `Ausente · ${content().calls[c.id]?.whereabouts ?? 'em outro lugar'}`}</Tag>}
            </div>
          </button>
        );
      })}
    </section>
  );
}
