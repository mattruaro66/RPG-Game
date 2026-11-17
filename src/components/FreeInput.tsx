import { useEffect, useRef, useState } from 'react';
import { CHARACTER_BY_ID, shortName } from '../data/characters';
import { interpret } from '../ai/interpreter';
import { canAct } from '../engine/sanity';
import type { GameState } from '../engine/state';
import type { CharacterId } from '../engine/types';
import { errorCode, useCapability, type DictationApi, type SampleApi } from '../platform/claude';
import { freeText } from '../state/session';
import { useGame } from '../state/GameContext';

/**
 * Resposta livre: o jogador escreve (ou dita) o que seu personagem diz ou faz.
 */
export function FreeInput({ game }: { game: GameState }) {
  const { update, notify } = useGame();
  const able = game.party.filter(canAct);
  const defaultSpeaker = (able.find((c) => c.control === 'jogador') ?? able.find((c) => c.id === game.contactId) ?? able[0])?.id;
  const [speaker, setSpeaker] = useState<CharacterId | undefined>(defaultSpeaker);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sample, setSample] = useState<SampleApi | null>(null);
  const [sampleOff, setSampleOff] = useState(false);
  const [dictation, setDictation] = useState<DictationApi | null>(null);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const baseRef = useRef('');

  useEffect(() => {
    let alive = true;
    const offs: (() => void)[] = [];
    useCapability('sample').then((s) => alive && setSample(s));
    useCapability('dictation').then((d) => {
      if (!alive || !d) return;
      setDictation(d);
      try {
        offs.push(d.onPartial(({ text: t }) => setPartial(t)));
        offs.push(
          d.onFinal(({ text: t }) => {
            baseRef.current = `${baseRef.current}${baseRef.current && !baseRef.current.endsWith(' ') ? ' ' : ''}${t}`;
            setText(baseRef.current);
            setPartial('');
          }),
        );
        offs.push(d.onState(({ state }) => setListening(state === 'listening' || state === 'starting')));
      } catch {
        /* ignora */
      }
    });
    return () => {
      alive = false;
      offs.forEach((o) => o());
    };
  }, []);

  useEffect(() => {
    if (speaker && !able.some((c) => c.id === speaker)) setSpeaker(defaultSpeaker);
  }, [able, speaker, defaultSpeaker]);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const r = await interpret(sampleOff ? null : sample, game, t, speaker ?? null);
      update((s) => freeText(s, t, r, speaker));
      setText('');
      baseRef.current = '';
    } catch (e) {
      if (['not_granted', 'sampling_disabled', 'capability_disabled'].includes(errorCode(e))) {
        setSampleOff(true);
        notify('O Claude não está disponível para interpretar respostas. Usando o interpretador simples.');
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleMic = () => {
    if (!dictation) return;
    if (listening) {
      dictation.stop().catch(() => undefined);
      return;
    }
    baseRef.current = text;
    // start() precisa ser chamado direto do clique.
    dictation.start({ language: 'pt-BR' }).catch((e) => {
      const code = errorCode(e);
      if (code === 'not_granted') setDictation(null);
      else if (code !== 'dismissed') notify('Não foi possível usar o microfone agora.');
    });
  };

  return (
    <form
      className="free-input"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor="free-text" className="free-label">
        Ou escreva o que
        <select id="free-speaker" value={speaker ?? ''} onChange={(e) => setSpeaker(e.target.value as CharacterId)} aria-label="Quem fala ou age">
          {able.map((c) => <option key={c.id} value={c.id}>{shortName(CHARACTER_BY_ID[c.id])}</option>)}
        </select>
        diz ou faz:
      </label>
      <div className="free-row">
        <textarea
          id="free-text"
          rows={2}
          value={listening && partial ? `${text}${text ? ' ' : ''}${partial}` : text}
          onChange={(e) => {
            setText(e.target.value);
            baseRef.current = e.target.value;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={game.dialogue ? 'Ex.: “Seu marido sabia do Thomas?”' : 'Ex.: “Olho dentro das gavetas da escrivaninha.”'}
          disabled={busy}
          maxLength={600}
        />
        <div className="free-buttons">
          {dictation && (
            <button type="button" className={`btn-small mic${listening ? ' on' : ''}`} onClick={toggleMic} aria-pressed={listening} title="Ditado por voz">
              {listening ? '■ Parar' : '● Falar'}
            </button>
          )}
          <button type="submit" className="btn-primary btn-small" disabled={busy || !text.trim()}>{busy ? 'Narrador…' : 'Agir'}</button>
        </div>
      </div>
      <p className="free-hint muted small">
        {sample && !sampleOff
          ? 'O Claude interpreta sua resposta e a encaixa numa ação possível. Os testes e as consequências seguem as regras do jogo.'
          : 'Interpretador simples: use palavras parecidas com as das ações acima.'}
      </p>
    </form>
  );
}
