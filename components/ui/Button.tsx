import { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import clsx from "clsx";
import Link from "next/link";

const base =
  "inline-flex items-center justify-center font-sans font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2";

const variants = {
  primary:
    "bg-stone-900 text-white px-6 py-3 text-sm tracking-wide hover:bg-stone-800",
  secondary:
    "border border-stone-900 text-stone-900 px-6 py-3 text-sm tracking-wide hover:bg-stone-900 hover:text-white",
  ghost:
    "text-stone-700 px-4 py-2 text-sm hover:text-stone-900 underline underline-offset-4 decoration-accent/40 hover:decoration-accent",
};

type ButtonProps = {
  variant?: keyof typeof variants;
  href?: string;
  className?: string;
} & (ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>);

export function Button({
  variant = "primary",
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = clsx(base, variants[variant], className);

  if (href) {
    return (
      <Link href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
