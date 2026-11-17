import { useState } from 'react';
import { IMAGE_SLOTS, KIND_LABELS, type ImageKind } from '../data/images';
import { useImages } from '../platform/images';
import { useGame } from '../state/GameContext';
import { UploadButton } from '../components/SceneImage';
import { Tag } from '../components/ui';

export function GalleryScreen() {
  const { go, game, notify } = useGame();
  const { resolve, canUpload } = useImages();
  const [copied, setCopied] = useState<string | null>(null);
  const kinds = Object.keys(KIND_LABELS) as ImageKind[];
  const total = IMAGE_SLOTS.length;
  const filled = IMAGE_SLOTS.filter((s) => resolve(s.id)?.url).length;

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
    } catch {
      const el = document.getElementById(`prompt-${id}`);
      if (el) {
        const r = document.createRange();
        r.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(r);
      }
      notify('Texto selecionado. Use Ctrl+C para copiar.');
    }
  };

  return (
    <main className="doc-screen">
      <header className="doc-head">
        <button className="btn-ghost" onClick={() => go(game ? 'jogo' : 'menu')}>← Voltar</button>
        <h1>Galeria</h1>
        <span className="muted">{filled} de {total} imagens definidas</span>
      </header>
      <p className="muted gallery-intro">
        Cada vaga é algo que o jogo mostra. Fotos de acervo já vêm embutidas, com crédito. Para as demais, copie o prompt, gere a imagem no seu gerador preferido
        e {canUpload ? 'envie aqui mesmo' : 'envie pela versão publicada do jogo (como dono ou editor)'}. Imagens coloridas são exibidas em preto e branco, exceto as marcadas com cor.
      </p>
      {kinds.map((k) => (
        <section key={k}>
          <h2 className="gallery-kind">{KIND_LABELS[k]}</h2>
          <div className="gallery-grid">
            {IMAGE_SLOTS.filter((s) => s.kind === k).map((s) => {
              const r = resolve(s.id)!;
              return (
                <article key={s.id} className="gallery-card paper-card">
                  <div className={`gallery-photo${s.keepColor ? ' keep-color' : ''}`}>
                    {r.url ? <img src={r.url} alt={s.title} loading="lazy" /> : <div className="photo-missing small"><span className="photo-missing-title">{s.title}</span><span className="photo-missing-note">sem imagem</span></div>}
                  </div>
                  <div className="gallery-body">
                    <h3>{s.title} {r.source === 'acervo' && <Tag tone="ok">acervo</Tag>}{r.source === 'enviada' && <Tag tone="ok">enviada</Tag>}{r.source === 'nenhuma' && <Tag tone="warn">pendente</Tag>}{s.keepColor && <Tag tone="wine">mantém o vermelho</Tag>}</h3>
                    <p className="small">{s.caption}</p>
                    {r.source === 'acervo' && s.bundled && <p className="small muted">Foto: {s.bundled.credit} · {s.bundled.license} · <a href={s.bundled.source} target="_blank" rel="noreferrer">fonte</a></p>}
                    <details>
                      <summary>Prompt para gerar</summary>
                      <p className="prompt" id={`prompt-${s.id}`}>{s.prompt}</p>
                      <button className="btn-small" onClick={() => copy(s.id, s.prompt)}>{copied === s.id ? 'Copiado' : 'Copiar prompt'}</button>
                    </details>
                    <UploadButton slotId={s.id} onDone={notify} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
