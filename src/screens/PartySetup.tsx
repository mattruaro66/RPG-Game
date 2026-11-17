import { useMemo, useState } from 'react';
import { CANONICAL } from '../config/rules';
import { BONUSES } from '../data/bonuses';
import { CHARACTERS, CHARACTER_BY_ID, displayName, shortName } from '../data/characters';
import { specialtiesOf } from '../data/specialties';
import { validateSelection, type CharacterSelection } from '../engine/party';
import { ATTRIBUTE_IDS, ATTRIBUTE_LABELS, PROFESSION_LABELS, type CharacterId, type ControlMode } from '../engine/types';
import { Portrait, Tag } from '../components/ui';
import { useGame } from '../state/GameContext';

type Step = 'escolha' | 'detalhes' | 'confirmar';

export function PartySetup() {
  const { go, startNew } = useGame();
  const [step, setStep] = useState<Step>('escolha');
  const [picked, setPicked] = useState<CharacterId[]>([]);
  const [sel, setSel] = useState<Record<string, CharacterSelection>>({});
  const [active, setActive] = useState<CharacterId | null>(null);

  const toggle = (id: CharacterId) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < CANONICAL.partySize ? [...p, id] : p));
  };

  const goDetails = () => {
    const next: Record<string, CharacterSelection> = {};
    picked.forEach((id, i) => {
      next[id] = sel[id] ?? { id, specialties: [], bonuses: [], control: i === 0 ? 'jogador' : 'ia' };
    });
    setSel(next);
    setActive(picked[0]);
    setStep('detalhes');
  };

  const selections = picked.map((id) => sel[id]).filter(Boolean);
  const validation = useMemo(() => validateSelection(selections), [selections]);
  const complete = (id: CharacterId) => sel[id]?.specialties.length === CANONICAL.specialtiesPerCharacter && sel[id]?.bonuses.length === CANONICAL.bonusesPerCharacter;

  const update = (id: CharacterId, patch: Partial<CharacterSelection>) => setSel((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  const toggleIn = (list: string[], v: string, max: number) => (list.includes(v) ? list.filter((x) => x !== v) : list.length < max ? [...list, v] : list);

  return (
    <main className="setup-screen">
      <header className="setup-head">
        <button className="btn-ghost" onClick={() => (step === 'escolha' ? go('prologo') : setStep(step === 'confirmar' ? 'detalhes' : 'escolha'))}>← Voltar</button>
        <ol className="steps">
          <li className={step === 'escolha' ? 'on' : ''}>1. Escolher quatro</li>
          <li className={step === 'detalhes' ? 'on' : ''}>2. Especialidades e bônus</li>
          <li className={step === 'confirmar' ? 'on' : ''}>3. Confirmar</li>
        </ol>
      </header>

      {step === 'escolha' && (
        <section>
          <h1 className="section-title">Quem atende ao telefone esta noite?</h1>
          <p className="muted">Escolha quatro dos seis protagonistas ({picked.length}/4). Atributos são fixos por profissão.</p>
          <div className="dossier-grid">
            {CHARACTERS.map((c) => {
              const on = picked.includes(c.id);
              return (
                <button key={c.id} className={`dossier${on ? ' selected' : ''}`} onClick={() => toggle(c.id)} aria-pressed={on}>
                  <div className="dossier-top">
                    <Portrait id={c.id} size={64} />
                    <div>
                      <h3>{displayName(c)}</h3>
                      <p className="dossier-prof">{PROFESSION_LABELS[c.profession]} · {c.age} anos</p>
                      <p className="dossier-occ">{c.occupation}</p>
                    </div>
                    {on && <span className="stamp small">Selecionado</span>}
                  </div>
                  <p className="dossier-pers">{c.personality}</p>
                  <dl className="attr-row">
                    {ATTRIBUTE_IDS.map((a) => (
                      <div key={a}><dt>{ATTRIBUTE_LABELS[a].slice(0, 3)}</dt><dd>{c.attributes[a]}</dd></div>
                    ))}
                  </dl>
                </button>
              );
            })}
          </div>
          <div className="setup-actions">
            <button className="btn-primary" disabled={picked.length !== 4} onClick={goDetails}>Continuar →</button>
          </div>
        </section>
      )}

      {step === 'detalhes' && active && (
        <section className="details-layout">
          <aside className="details-tabs">
            {picked.map((id) => (
              <button key={id} className={`details-tab${active === id ? ' on' : ''}`} onClick={() => setActive(id)}>
                <Portrait id={id} size={32} />
                <span>{shortName(CHARACTER_BY_ID[id])}</span>
                {complete(id) ? <Tag tone="ok">pronto</Tag> : <Tag tone="muted">{sel[id].specialties.length}/3 · {sel[id].bonuses.length}/2</Tag>}
              </button>
            ))}
          </aside>
          <div className="details-body">
            <h2>{displayName(CHARACTER_BY_ID[active])} <small className="muted">— {PROFESSION_LABELS[CHARACTER_BY_ID[active].profession]}</small></h2>
            <p className="muted">{CHARACTER_BY_ID[active].background}</p>

            <div className="control-pick">
              <span>Controle:</span>
              {(['jogador', 'ia'] as ControlMode[]).map((m) => (
                <label key={m} className="radio">
                  <input type="radio" checked={sel[active].control === m} onChange={() => update(active, { control: m })} />
                  {m === 'jogador' ? 'Jogador' : 'IA (personalidade do personagem)'}
                </label>
              ))}
            </div>

            <h3>Especialidades <small className="muted">({sel[active].specialties.length}/3)</small></h3>
            <div className="choice-grid">
              {specialtiesOf(CHARACTER_BY_ID[active].profession).map((sp) => {
                const on = sel[active].specialties.includes(sp.id);
                const full = !on && sel[active].specialties.length >= 3;
                return (
                  <button key={sp.id} className={`choice${on ? ' on' : ''}`} disabled={full} onClick={() => update(active, { specialties: toggleIn(sel[active].specialties, sp.id, 3) })}>
                    <strong>{sp.name}</strong>
                    <span>{sp.description}</span>
                  </button>
                );
              })}
            </div>

            <h3>Bônus <small className="muted">({sel[active].bonuses.length}/2)</small></h3>
            <div className="choice-grid bonuses">
              {BONUSES.map((b) => {
                const on = sel[active].bonuses.includes(b.id);
                const full = !on && sel[active].bonuses.length >= 2;
                return (
                  <button key={b.id} className={`choice${on ? ' on' : ''}`} disabled={full} onClick={() => update(active, { bonuses: toggleIn(sel[active].bonuses, b.id, 2) })}>
                    <strong>{b.number}. {b.name}</strong>
                    <span>{b.description}</span>
                    {b.onus && <span className="onus">Ônus: {b.onus.description}</span>}
                  </button>
                );
              })}
            </div>

            <div className="setup-actions">
              {picked.indexOf(active) < picked.length - 1 && (
                <button onClick={() => setActive(picked[picked.indexOf(active) + 1])}>Próximo personagem →</button>
              )}
              <button className="btn-primary" disabled={!validation.ok} onClick={() => setStep('confirmar')}>Revisar grupo →</button>
            </div>
          </div>
        </section>
      )}

      {step === 'confirmar' && (
        <section>
          <h1 className="section-title">O grupo</h1>
          <div className="confirm-grid">
            {selections.map((s) => {
              const def = CHARACTER_BY_ID[s.id];
              return (
                <article key={s.id} className="paper-card">
                  <div className="dossier-top">
                    <Portrait id={s.id} size={56} />
                    <div>
                      <h3>{displayName(def)}</h3>
                      <p className="dossier-prof">{PROFESSION_LABELS[def.profession]} · {s.control === 'jogador' ? 'Jogador' : 'IA'}</p>
                    </div>
                  </div>
                  <p><strong>Especialidades:</strong> {s.specialties.map((x) => specialtiesOf(def.profession).find((sp) => sp.id === x)?.name).join(', ')}</p>
                  <p><strong>Bônus:</strong> {s.bonuses.map((b) => BONUSES.find((x) => x.id === b)?.name).join(', ')}</p>
                </article>
              );
            })}
          </div>
          {!validation.ok && <ul className="errors">{validation.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
          <div className="setup-actions">
            <button className="btn-primary" disabled={!validation.ok} onClick={() => startNew(selections)}>Iniciar a campanha</button>
          </div>
        </section>
      )}
    </main>
  );
}
