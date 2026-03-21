import { ReactNode } from "react";
import clsx from "clsx";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto max-w-content px-6 md:px-8 lg:px-12", className)}>
      {children}
    </div>
  );
}
