// ═══ Shared interaction primitives ═══
// Dependency-free, light-theme, touch-friendly: a ⋯ dropdown menu, plus an
// overlay provider exposing useConfirm() (promise-based confirm dialog) and
// useToast() (transient toast with an optional Undo action). Also a Skeleton.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, X } from 'lucide-react';
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
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  // Place the dropdown in a fixed-position portal so it is never clipped by an
  // overflow-hidden ancestor (e.g. a rounded asset/template card). Flips above
  // the trigger when there isn't room below.
  const place = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const menuH = items.length * 40 + 12;
    const below = b.bottom + 4;
    const flipUp = below + menuH > window.innerHeight - 8;
    setPos({ top: flipUp ? Math.max(8, b.top - menuH - 4) : below, right: Math.max(8, window.innerWidth - b.right) });
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const reclose = () => setOpen(false); // close on scroll/resize rather than drift
    window.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', reclose, true);
    window.addEventListener('resize', reclose);
    return () => {
      window.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', reclose, true);
      window.removeEventListener('resize', reclose);
    };
  }, [open]);

  const stop = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={(e) => { stop(e); if (!open) place(); setOpen((o) => !o); }}
        className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 200 }}
          className="min-w-[176px] overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-xl shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:shadow-black/40"
        >
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              disabled={it.disabled}
              onClick={(e) => { stop(e); setOpen(false); it.onClick(); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors disabled:opacity-40 ${
                it.danger ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40' : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>,
        document.body,
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
        <div className="fixed inset-0 z-[100] grid place-items-center bg-zinc-900/40 p-4 backdrop-blur-sm dark:bg-black/60" onMouseDown={() => close(false)}>
          <div className="eng-rise w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-900/15 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/50" onMouseDown={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <h3 className="text-[16px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{pending.title}</h3>
            {pending.body && <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{pending.body}</p>}
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
          <div key={t.id} className="eng-rise pointer-events-auto flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 shadow-xl shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:shadow-black/40">
            <span className="text-[13px] text-zinc-700 dark:text-zinc-200">{t.message}</span>
            {t.actionLabel && (
              <button
                onClick={() => { t.onAction?.(); dismiss(t.id); }}
                className="text-[13px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
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
  return <div className={`animate-pulse rounded-lg bg-zinc-200/70 dark:bg-zinc-800 ${className}`} />;
}

// ── Drawer / bottom sheet ───────────────────────────────────────────
// A slide-over panel with a scrim. `side="left"` is the mobile brand drawer;
// `side="bottom"` is a bottom sheet (settings, mobile inspectors). Closes on
// scrim click + Escape; locks body scroll while open; touch-friendly.
export function Drawer({
  open,
  onClose,
  side = 'left',
  label,
  children,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'bottom';
  label: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  const panel =
    side === 'left'
      ? 'eng-slide-left absolute inset-y-0 left-0 w-[84%] max-w-[20rem] rounded-r-2xl'
      : 'eng-slide-up absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl';

  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-label={label}>
      <div className="eng-fade absolute inset-0 bg-zinc-900/40 backdrop-blur-sm dark:bg-black/60" onClick={onClose} />
      <div
        className={`${panel} flex flex-col overflow-y-auto border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/60 ${className}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
          <span className="text-[14px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{label}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────
// Underline tabs that scroll horizontally on mobile (no wrap, edge-to-edge,
// snap) and sit on a baseline border. 44px tap height; dark-aware.
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className = '',
}: {
  tabs: { id: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`eng-noscroll -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 ${className}`}>
      <div role="tablist" className="flex min-w-max gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tb) => {
          const active = tb.id === value;
          return (
            <button
              key={tb.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tb.id)}
              className={`-mb-px shrink-0 snap-start whitespace-nowrap border-b-2 px-3.5 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                active
                  ? 'border-violet-600 text-violet-700 dark:border-violet-400 dark:text-violet-300'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {tb.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Segmented control ───────────────────────────────────────────────
// A pill toggle for small mutually-exclusive choices (density, theme,
// language). Touch-friendly, keyboard-navigable, dark-aware.
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  className = '',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : 'px-3 py-2 text-[13px]';
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex items-center gap-0.5 rounded-full border border-zinc-200 bg-zinc-100/70 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/70 ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            title={o.title}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`rounded-full font-semibold tracking-tight transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${pad} ${
              active
                ? 'bg-white text-violet-700 shadow-sm dark:bg-zinc-900 dark:text-violet-300'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
