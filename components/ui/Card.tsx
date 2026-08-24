import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export type CardVariant = "default" | "bordered" | "elevated";

export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-[var(--surface)]",
  bordered: "border border-[var(--line)] bg-[var(--surface)]",
  elevated:
    "border border-[var(--line)] bg-[var(--surface-raised)] shadow-[var(--shadow-md)]",
};

export function Card({
  children,
  className,
  variant = "default",
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--r-lg)] p-6 text-[var(--ink)]",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
