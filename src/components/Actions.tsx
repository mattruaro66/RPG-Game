import { useState } from 'react';
import { CHARACTER_BY_ID, shortName } from '../data/characters';
import { specialtyName } from '../data/specialties';
import { describeTest } from '../engine/checks';
import { content } from '../engine/narrative/registry';
import { currentDialogueNode, defaultActor, previewTest, visibleInteractions, visibleOptions } from '../engine/narrative/scene';
import type { Interaction, TestSpec } from '../engine/narrative/types';
import { canAct } from '../engine/sanity';
import type { GameState } from '../engine/state';
import { ATTRIBUTE_LABELS, type CharacterId } from '../engine/types';
import { chooseOption, interact, resolvePending } from '../state/session';
import { useGame } from '../state/GameContext';
import { Tag } from './ui';

const KIND_LABELS: Record<Interaction['kind'], string> = {
  examinar: 'Examinar',
  investigar: 'Investigar',
  dialogo: 'Conversar',
  acao: 'Agir',
  mover: 'Ir para',
  esperar: 'Tempo',
};

interface PendingChoice {
  label: string;
  spec: TestSpec;
  hint?: string;
  run: (actor: CharacterId, helpers: CharacterId[]) => void;
}

function TestPicker({ game, choice, onCancel }: { game: GameState; choice: PendingChoice; onCancel: () => void }) {
  const able = game.party.filter(canAct);
  const suggested = defaultActor(game, choice.spec);
  const [actor, setActor] = useState<CharacterId | undefined>(suggested);
  const [helpers, setHelpers] = useState<CharacterId[]>([]);
  const spec = choice.spec;
  const specs = [spec.specialty, ...(spec.altSpecialties ?? [])].filter(Boolean) as string[];

  return (
    <div className="test-picker paper-card">
      <h3>{choice.label}</h3>
      <p className="muted">
        Teste {spec.kind === 'd6' ? 'simples (D6)' : 'de ação (D20)'} · {ATTRIBUTE_LABELS[spec.attribute]}
        {specs.length > 0 && <> · {specs.map(specialtyName).join(' / ')}</>}
      </p>
      {choice.hint && <p className="small">{choice.hint}</p>}
      <p className="small strong">Quem tenta?</p>
      <div className="picker-list">
        {able.map((c) => {
          const p = previewTest(game, c, spec);
          const b = p.breakdown;
          return (
            <label key={c.id} className={`picker-row${actor === c.id ? ' on' : ''}`}>
              <input type="radio" name="actor" checked={actor === c.id} onChange={() => { setActor(c.id); setHelpers((h) => h.filter((x) => x !== c.id)); }} />
              <span className="picker-name">{shortName(CHARACTER_BY_ID[c.id])}{c.control === 'ia' && <Tag tone="muted">IA</Tag>}{suggested === c.id && <Tag tone="ok">sugerido</Tag>}</span>
              <span className="picker-limit">{p.label}</span>
              {b && (
                <span className="picker-notes">
                  {b.hasSpecialty ? specialtyName(b.specialtyId!) : 'sem especialidade'}
                  {b.appliedBonus && <Tag tone="ok">+ {b.appliedBonus.name}</Tag>}
                  {b.appliedOnus && <Tag tone="warn">ônus: {b.appliedOnus.name}</Tag>}
                </span>
              )}
            </label>
          );
        })}
      </div>
      {spec.allowCooperation && spec.kind === 'd20' && (
        <>
          <p className="small strong">Cooperação (até 2 ajudantes)</p>
          <div className="row wrap">
            {able.filter((c) => c.id !== actor).map((c) => {
              const on = helpers.includes(c.id);
              return (
                <label key={c.id} className="check">
                  <input type="checkbox" checked={on} disabled={!on && helpers.length >= 2} onChange={() => setHelpers((h) => (on ? h.filter((x) => x !== c.id) : [...h, c.id]))} />
                  {shortName(CHARACTER_BY_ID[c.id])} ({previewTest(game, c, spec).label})
                </label>
              );
            })}
          </div>
        </>
      )}
      <div className="row">
        <button className="btn-primary" disabled={!actor} onClick={() => actor && choice.run(actor, helpers)}>Rolar</button>
        <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function PendingTestPrompt({ game }: { game: GameState }) {
  const { update } = useGame();
  const p = game.pendingTest!;
  return (
    <div className="pending paper-card">
      <h3>Teimosia Inabalável</h3>
      <pre className="dice-lines">{describeTest(p.main, shortName(CHARACTER_BY_ID[p.actorId])).join('\n')}</pre>
      <p>{shortName(CHARACTER_BY_ID[p.actorId])} pode repetir o D20 uma vez. O segundo resultado é obrigatório, mesmo que seja pior.</p>
      <div className="row">
        <button className="btn-primary" onClick={() => update((s) => resolvePending(s, true))}>Repetir o D20</button>
        <button onClick={() => update((s) => resolvePending(s, false))}>Aceitar o resultado</button>
      </div>
    </div>
  );
}

export function Actions({ game }: { game: GameState }) {
  const { update } = useGame();
  const [choice, setChoice] = useState<PendingChoice | null>(null);

  if (game.gameOver) return null;
  if (game.pendingTest) return <PendingTestPrompt game={game} />;
  if (choice) return <TestPicker game={game} choice={choice} onCancel={() => setChoice(null)} />;

  const dlg = currentDialogueNode(game);
  if (dlg) {
    const opts = visibleOptions(game);
    return (
      <div className="actions">
        <h3 className="actions-title">Conversa com {dlg.npc?.name}</h3>
        <div className="option-list">
          {opts.map((o) => (
            <button
              key={o.id}
              className={`option${o.test ? ' has-test' : ''}`}
              onClick={() => {
                if (o.test) setChoice({ label: o.label, spec: o.test, run: (a, h) => { update((s) => chooseOption(s, o.id, a, h)); setChoice(null); } });
                else update((s) => chooseOption(s, o.id));
              }}
            >
              {o.label}
              {o.test && <Tag tone="wine">{o.test.kind.toUpperCase()} · {ATTRIBUTE_LABELS[o.test.attribute]}</Tag>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const list = visibleInteractions(game);
  const groups = (Object.keys(KIND_LABELS) as Interaction['kind'][]).map((k) => ({ k, items: list.filter((i) => i.kind === k) })).filter((g) => g.items.length);
  const scene = content().scenes[game.sceneId];

  return (
    <div className="actions">
      <h3 className="actions-title">{scene.title}</h3>
      {groups.map((g) => (
        <div key={g.k} className="action-group">
          <h4>{KIND_LABELS[g.k]}</h4>
          <div className="option-list">
            {g.items.map((it) => (
              <button
                key={it.id}
                className={`option${it.test ? ' has-test' : ''}`}
                title={it.hint}
                onClick={() => {
                  if (it.test) setChoice({ label: it.label, spec: it.test, hint: it.hint, run: (a, h) => { update((s) => interact(s, it.id, a, h)); setChoice(null); } });
                  else update((s) => interact(s, it.id));
                }}
              >
                {it.label}
                {it.test && <Tag tone="wine">{it.test.kind.toUpperCase()} · {ATTRIBUTE_LABELS[it.test.attribute]}</Tag>}
              </button>
            ))}
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="muted">Nada mais a fazer aqui por enquanto.</p>}
    </div>
  );
}
