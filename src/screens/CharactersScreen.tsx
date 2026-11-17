import { CHARACTERS, CHARACTER_BY_ID, displayName, shortName } from '../data/characters';
import { specialtiesOf } from '../data/specialties';
import { ATTRIBUTE_IDS, ATTRIBUTE_LABELS, PROFESSION_LABELS } from '../engine/types';
import { Portrait, Tag } from '../components/ui';
import { useGame } from '../state/GameContext';

export function CharactersScreen() {
  const { go } = useGame();
  return (
    <main className="doc-screen">
      <header className="doc-head">
        <button className="btn-ghost" onClick={() => go('menu')}>← Menu</button>
        <h1>Personagens</h1>
      </header>
      <div className="doc-grid">
        {CHARACTERS.map((c) => (
          <article key={c.id} className="paper-card">
            <div className="dossier-top">
              <Portrait id={c.id} size={72} />
              <div>
                <h2>{displayName(c)}</h2>
                <p className="dossier-prof">{PROFESSION_LABELS[c.profession]} · {c.age} anos</p>
                <p className="dossier-occ">{c.occupation}</p>
              </div>
            </div>
            <p><em>{c.personality}</em></p>
            <p>{c.background} {c.backgroundStatus === 'PROPOSTO' && <Tag tone="muted" title="Biografia ainda refinável pelo criador">proposto</Tag>}</p>
            <p className="muted">Conhece: {c.knows.map((k) => shortName(CHARACTER_BY_ID[k])).join(', ')}</p>
            <dl className="attr-row">
              {ATTRIBUTE_IDS.map((a) => (
                <div key={a}><dt>{ATTRIBUTE_LABELS[a]}</dt><dd>{c.attributes[a]}</dd></div>
              ))}
            </dl>
            <details>
              <summary>Especialidades da profissão</summary>
              <ul className="compact">{specialtiesOf(c.profession).map((s) => <li key={s.id}><strong>{s.name}:</strong> {s.description}</li>)}</ul>
            </details>
          </article>
        ))}
      </div>
    </main>
  );
}
