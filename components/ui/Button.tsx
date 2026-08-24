import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  children: ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export interface ButtonLinkProps
  extends ButtonBaseProps,
    Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      "children" | "className" | "href"
    > {
  href: string;
}

export interface ButtonActionProps
  extends ButtonBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> {
  href?: never;
}

export type ButtonProps = ButtonLinkProps | ButtonActionProps;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--terra-hover)] text-[var(--on-terra)] shadow-[var(--shadow-sm)] hover:bg-[var(--terra-press)] active:bg-[var(--terra-press)]",
  secondary:
    "border border-[var(--line-strong)] bg-[var(--surface-raised)] text-[var(--ink)] shadow-[var(--shadow-sm)] hover:bg-[var(--band)]",
  ghost:
    "bg-transparent text-[var(--ink-muted)] hover:bg-[var(--band)] hover:text-[var(--ink)]",
  destructive:
    "bg-[var(--danger)] text-white shadow-[var(--shadow-sm)] hover:brightness-95 active:brightness-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  children,
  className = "",
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-[var(--r-md)] font-semibold",
    "transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-bg)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (typeof props.href === "string") {
    const { href, ...linkProps } = props;

    return (
      <Link className={classes} href={href} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
