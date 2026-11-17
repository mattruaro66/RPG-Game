import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { IMAGE_BY_ID, type ImageSlot } from '../data/images';
import { errorCode, useCapability, type AssetsApi, type DbApi, type UserApi } from './claude';

/**
 * Resolução de imagens: imagem enviada (banco compartilhado do artefato)
 * → foto de acervo embutida → nenhuma (moldura com legenda).
 */

export interface ResolvedImage {
  slot: ImageSlot;
  url: string | null;
  source: 'enviada' | 'acervo' | 'nenhuma';
}

interface ImagesCtx {
  resolve(id: string | undefined): ResolvedImage | null;
  canUpload: boolean;
  upload(slotId: string, file: File): Promise<string | null>;
  remove(slotId: string): Promise<string | null>;
}

const Ctx = createContext<ImagesCtx | null>(null);

export function ImagesProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [db, setDb] = useState<DbApi | null>(null);
  const [assets, setAssets] = useState<AssetsApi | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let alive = true;
    useCapability('db').then((d) => {
      if (!alive || !d) return;
      setDb(d);
      try {
        unsub = d.collection('imagens').onSnapshot(
          (snap) => {
            const map: Record<string, string> = {};
            for (const doc of snap.docs) {
              const url = doc.data()?.url;
              // Só aceita endereços do próprio armazenamento do artefato.
              if (typeof url === 'string' && url.startsWith('/_blob/')) map[doc.id] = url;
            }
            setOverrides(map);
          },
          () => setOverrides({}),
        );
      } catch {
        /* banco indisponível */
      }
    });
    useCapability('assets').then((a) => alive && setAssets(a));
    useCapability('user').then((u: UserApi | null) => {
      if (!alive || !u) return;
      try {
        setCanEdit(u.canEdit());
      } catch {
        setCanEdit(false);
      }
    });
    return () => {
      alive = false;
      unsub?.();
    };
  }, []);

  const value = useMemo<ImagesCtx>(
    () => ({
      resolve(id) {
        if (!id) return null;
        const slot = IMAGE_BY_ID[id];
        if (!slot) return null;
        if (overrides[id]) return { slot, url: overrides[id], source: 'enviada' };
        if (slot.bundled) return { slot, url: slot.bundled.file, source: 'acervo' };
        return { slot, url: null, source: 'nenhuma' };
      },
      canUpload: !!(db && assets && canEdit),
      async upload(slotId, file) {
        if (!db || !assets) return 'O envio de imagens só funciona no artefato publicado.';
        if (!file.type.startsWith('image/')) return 'Escolha um arquivo de imagem (JPG, PNG ou WebP).';
        try {
          const r = await assets.upload(file);
          await db.collection('imagens').doc(slotId).set({ url: `/_blob/${r.id}`, assetId: r.id, updatedAt: new Date().toISOString() });
          return null;
        } catch (e) {
          const code = errorCode(e);
          if (code === 'too_large') return 'Imagem grande demais (limite de 20 MB).';
          if (code === 'not_granted' || code === 'not_uploader') return 'Você não tem permissão para enviar imagens neste artefato.';
          return `Não foi possível enviar a imagem (${code}).`;
        }
      },
      async remove(slotId) {
        if (!db) return 'Indisponível fora do artefato publicado.';
        try {
          await db.collection('imagens').doc(slotId).delete();
          return null;
        } catch (e) {
          return `Não foi possível remover (${errorCode(e)}).`;
        }
      },
    }),
    [overrides, db, assets, canEdit],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useImages(): ImagesCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useImages fora do ImagesProvider');
  return c;
}
