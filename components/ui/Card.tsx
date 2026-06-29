import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export type CardVariant = "default" | "bordered" | "elevated";

export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-white",
  bordered: "border border-zinc-200 bg-white",
  elevated: "border border-zinc-100 bg-white shadow-sm shadow-zinc-200/70",
};

export function Card({
  children,
  className,
  variant = "default",
}: CardProps) {
  return (
    <div className={cn("rounded-lg p-6", variantClasses[variant], className)}>
      {children}
    </div>
  );
}
