// ═══ Shared interaction primitives ═══
// Dependency-free, dark-theme, touch-friendly: a ⋯ dropdown menu, plus an
// overlay provider exposing useConfirm() (promise-based confirm dialog) and
// useToast() (transient toast with an optional Undo action). Also a Skeleton.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from './ui';

// ── Dropdown menu ──────────────────────────────────────────────────
export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function Menu({ items, label = 'Actions' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('mousedown', onDoc); window.removeEventListener('keydown', onKey); };
  }, [open]);

  const stop = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={(e) => { stop(e); setOpen((o) => !o); }}
        className="grid h-8 w-8 place-items-center rounded-lg text-white/55 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-1 min-w-[176px] overflow-hidden rounded-xl border border-white/12 bg-[#161f33] p-1 shadow-2xl shadow-black/50">
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              disabled={it.disabled}
              onClick={(e) => { stop(e); setOpen(false); it.onClick(); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors disabled:opacity-40 ${
                it.danger ? 'text-red-300 hover:bg-red-500/10' : 'text-white/85 hover:bg-white/10'
              }`}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Overlay provider: confirm + toast ──────────────────────────────
interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}
interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}
interface Toast extends ToastOptions { id: number; }

interface OverlayApi {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  toast: (opts: ToastOptions) => void;
}

const OverlayContext = createContext<OverlayApi | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const confirm = useCallback(
    (opts: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...opts, resolve })),
    [],
  );
  const close = (v: boolean) => { pending?.resolve(v); setPending(null); };

  const toast = useCallback((opts: ToastOptions) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { ...opts, id }]);
    const ms = opts.duration ?? 6000;
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const api = useMemo<OverlayApi>(() => ({ confirm, toast }), [confirm, toast]);

  // Escape / Enter on the confirm dialog
  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <OverlayContext.Provider value={api}>
      {children}

      {pending && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={() => close(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/12 bg-[#141d30] p-5 shadow-2xl shadow-black/60" onMouseDown={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <h3 className="text-[16px] font-bold text-white">{pending.title}</h3>
            {pending.body && <p className="mt-2 text-[13px] leading-relaxed text-white/55">{pending.body}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="subtle" onClick={() => close(false)}>{pending.cancelLabel ?? 'Cancel'}</Button>
              <Button variant={pending.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
                {pending.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[110] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 rounded-xl border border-white/12 bg-[#1b2438] px-4 py-2.5 shadow-2xl shadow-black/50">
            <span className="text-[13px] text-white/85">{t.message}</span>
            {t.actionLabel && (
              <button
                onClick={() => { t.onAction?.(); dismiss(t.id); }}
                className="text-[13px] font-semibold text-indigo-300 hover:text-indigo-200"
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </OverlayContext.Provider>
  );
}

export function useOverlay(): OverlayApi {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlay must be used within OverlayProvider');
  return ctx;
}

// ── Skeleton ────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}
