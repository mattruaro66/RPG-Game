import { useRef, useState } from 'react';
import { useImages } from '../platform/images';

/** Foto em foco: local, pessoa ou objeto do momento. */
export function SceneImage({ slotId, compact = false, title }: { slotId: string | undefined; compact?: boolean; title?: string }) {
  const { resolve } = useImages();
  const img = resolve(slotId);
  if (!img) return null;
  const { slot, url, source } = img;
  const shownTitle = title ?? slot.title;
  return (
    <figure className={`scene-photo${compact ? ' compact' : ''}${slot.keepColor ? ' keep-color' : ''}`} key={slot.id}>
      {url ? (
        <img src={url} alt={`${shownTitle}. ${slot.caption}`} />
      ) : (
        <div className="photo-missing" role="img" aria-label={`${shownTitle}: imagem ainda não definida`}>
          <span className="photo-missing-title">{shownTitle}</span>
          <span className="photo-missing-note">Imagem a definir · veja a Galeria</span>
        </div>
      )}
      <figcaption>
        <strong>{shownTitle}</strong> <span>{slot.caption}</span>
        {source === 'acervo' && slot.bundled && <small className="credit">Foto: {slot.bundled.credit} · {slot.bundled.license}</small>}
      </figcaption>
    </figure>
  );
}

/** Miniatura (pistas, retratos). */
export function Thumb({ slotId, alt, className = 'thumb' }: { slotId: string | undefined; alt: string; className?: string }) {
  const { resolve } = useImages();
  const img = resolve(slotId);
  if (!img?.url) return null;
  return <img className={`${className}${img.slot.keepColor ? ' keep-color' : ''}`} src={img.url} alt={alt} loading="lazy" />;
}

/** Envio de imagem para uma vaga (somente quem pode editar o artefato). */
export function UploadButton({ slotId, onDone }: { slotId: string; onDone?: (msg: string) => void }) {
  const { canUpload, upload, remove, resolve } = useImages();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  if (!canUpload) return null;
  const current = resolve(slotId);
  return (
    <span className="row tight">
      <input
        ref={input}
        id={`upload-${slotId}`}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setBusy(true);
          const err = await upload(slotId, f);
          setBusy(false);
          onDone?.(err ?? 'Imagem enviada.');
        }}
      />
      <button className="btn-small" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Enviando…' : current?.source === 'enviada' ? 'Trocar imagem' : 'Enviar imagem'}</button>
      {current?.source === 'enviada' && (
        <button className="btn-small btn-ghost" disabled={busy} onClick={async () => onDone?.((await remove(slotId)) ?? 'Imagem removida.')}>Remover</button>
      )}
    </span>
  );
}
