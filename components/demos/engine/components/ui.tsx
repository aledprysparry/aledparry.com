// Tiny shared UI kit for the engine shell (dark, Linear-ish).
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'subtle' | 'ghost' | 'danger';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-indigo-500 text-white hover:bg-indigo-400',
  subtle: 'bg-white/5 border border-white/10 text-white/90 hover:bg-white/10',
  ghost: 'text-white/65 hover:text-white hover:bg-white/5',
  danger: 'text-red-300 hover:bg-red-500/10 border border-red-500/20',
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`w-full rounded-lg bg-black/30 border border-white/10 focus:border-indigo-400/60 focus:outline-none px-3 py-2 text-[13px] text-white/90 placeholder:text-white/25 ${className}`}
    />
  );
}

export function Panel({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-white/10 bg-[#141d30] ${className}`}>{children}</div>;
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'muted' }) {
  const tones = {
    default: 'bg-white/8 text-white/70',
    accent: 'bg-indigo-500/20 text-indigo-200',
    muted: 'bg-white/5 text-white/40',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <p className="text-[15px] font-semibold text-white/80">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-white/40">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
