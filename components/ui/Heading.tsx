import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

export type HeadingLevel = 1 | 2 | 3 | 4;

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  level?: HeadingLevel;
}

const levelClasses: Record<HeadingLevel, string> = {
  1: "text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl",
  2: "text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl",
  3: "text-2xl font-semibold tracking-tight text-[var(--ink)]",
  4: "text-xl font-semibold tracking-tight text-[var(--ink)]",
};

export function Heading({
  children,
  className,
  level = 2,
  ...props
}: HeadingProps) {
  const Component = `h${level}` as const;

  return (
    <Component className={cn(levelClasses[level], className)} {...props}>
      {children}
    </Component>
  );
}
