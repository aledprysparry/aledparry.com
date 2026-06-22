// Tiny shared UI kit for the engine shell (light + dark, violet brand, Geist).
// Matches the marketing site: rounded-full buttons, soft shadows, ink neutrals.
// Controls carry `eng-control` so the density setting (compact/comfortable/
// touch) drives their height + padding; `dark:` variants are scoped to the
// engine via the .postio-engine.dark selector (see tailwind.config darkMode).
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'subtle' | 'ghost' | 'danger';

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-violet-600 text-white shadow-sm shadow-violet-600/20 hover:bg-violet-700 hover:shadow-md hover:shadow-violet-600/25 dark:bg-violet-600 dark:hover:bg-violet-500 dark:shadow-none',
  subtle:
    'bg-white text-zinc-800 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 hover:ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:hover:ring-zinc-600',
  ghost:
    'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800',
  danger:
    'text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50 dark:text-red-400 dark:ring-red-900/50 dark:hover:bg-red-950/40',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      className={`eng-control inline-flex items-center justify-center gap-2 rounded-full px-3.5 font-semibold tracking-tight transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`eng-control w-full rounded-lg bg-white border border-zinc-200 px-3 text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-violet-500 ${className}`}
    />
  );
}

export function Panel({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'muted' }) {
  const tones = {
    default: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    accent: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    muted: 'bg-zinc-50 text-zinc-400 dark:bg-zinc-800/60 dark:text-zinc-500',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="text-[15px] font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
