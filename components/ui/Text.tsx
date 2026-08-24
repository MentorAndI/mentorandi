import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

export type TextVariant = "body" | "small" | "muted";

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  variant?: TextVariant;
}

const variantClasses: Record<TextVariant, string> = {
  body: "text-base leading-7 text-[var(--ink-muted)]",
  small: "text-sm leading-6 text-[var(--ink-muted)]",
  muted: "text-sm leading-6 text-[var(--ink-faint)]",
};

export function Text({
  children,
  className,
  variant = "body",
  ...props
}: TextProps) {
  return (
    <p className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </p>
  );
}
