import clsx from "clsx";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-block text-xs font-sans font-medium tracking-wider uppercase text-accent-dark bg-stone-100 px-2.5 py-1",
        className
      )}
    >
      {children}
    </span>
  );
}
