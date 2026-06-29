import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export type BadgeVariant = "default" | "muted" | "success" | "warning";

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-zinc-300 bg-white text-zinc-800",
  muted: "border-zinc-200 bg-zinc-100 text-zinc-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export function Badge({
  children,
  className,
  variant = "default",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
