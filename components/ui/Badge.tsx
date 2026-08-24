import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export type BadgeVariant = "default" | "muted" | "success" | "warning";

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "border-[var(--line-strong)] bg-[var(--surface-raised)] text-[var(--ink-muted)]",
  muted: "border-[var(--line)] bg-[var(--band)] text-[var(--ink-muted)]",
  success:
    "border-[color-mix(in_srgb,var(--success)_35%,var(--line))] bg-[color-mix(in_srgb,var(--success)_10%,var(--surface-raised))] text-[var(--success)]",
  warning:
    "border-[color-mix(in_srgb,var(--warning)_35%,var(--line))] bg-[color-mix(in_srgb,var(--warning)_10%,var(--surface-raised))] text-[var(--warning)]",
};

export function Badge({
  children,
  className,
  variant = "default",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "font-meta inline-flex items-center rounded-[var(--r-pill)] border px-2.5 py-1 text-[0.68rem] font-bold",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
