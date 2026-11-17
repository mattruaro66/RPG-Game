import type { ReactNode } from 'react';
import { CHARACTER_BY_ID } from '../data/characters';
import type { CharacterId } from '../engine/types';

export function Portrait({ id, size = 56, dim = false }: { id: CharacterId; size?: number; dim?: boolean }) {
  const def = CHARACTER_BY_ID[id];
  return (
    <div className={`portrait portrait-${id}${dim ? ' dim' : ''}`} style={{ width: size, height: size * 1.25, fontSize: size * 0.36 }} aria-hidden>
      <span>{def.initials}</span>
    </div>
  );
}

export function Bar({ value, max, kind, label }: { value: number; max: number; kind: 'hp' | 'san'; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`bar bar-${kind}`} title={label} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className="bar-fill" style={{ width: `${pct}%` }} />
      <span className="bar-text">{label ?? `${value}/${max}`}</span>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal${wide ? ' modal-wide' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Fechar">✕</button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Tag({ children, tone = 'neutral', title }: { children: ReactNode; tone?: 'neutral' | 'wine' | 'ok' | 'warn' | 'muted'; title?: string }) {
  return <span className={`tag tag-${tone}`} title={title}>{children}</span>;
}

export function Stamp({ children }: { children: ReactNode }) {
  return <span className="stamp">{children}</span>;
}
