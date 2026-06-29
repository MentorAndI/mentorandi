import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary";

interface ButtonBaseProps {
  children: ReactNode;
  className?: string;
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
  primary: "bg-zinc-950 text-white hover:bg-zinc-800",
  secondary: "border border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-50",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = `inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition ${variantClasses[variant]} ${className}`;

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
