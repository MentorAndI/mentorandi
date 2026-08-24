import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

export interface AuthFormShellLink {
  href: string;
  label: string;
  text: string;
}

export interface AuthFormShellProps {
  children: ReactNode;
  description: string;
  footerLink?: AuthFormShellLink;
  title: string;
}

export function AuthFormShell({
  children,
  description,
  footerLink,
  title,
}: AuthFormShellProps) {
  return (
    <Card
      className="w-full max-w-md space-y-8 border-[var(--line)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-md)] sm:p-8"
      variant="bordered"
    >
      <div>
        <p className="font-serif text-xl font-medium tracking-[-0.02em] text-[var(--ink)]">
          Mentor <span className="text-[var(--terra-text)]">And I</span>
        </p>
        <div className="mt-7 space-y-3">
          <Heading level={1}>{title}</Heading>
          <Text>{description}</Text>
        </div>
      </div>

      {children}

      {footerLink ? (
        <p className="border-t border-[var(--line)] pt-6 text-center text-sm text-[var(--ink-muted)]">
          {footerLink.text}{" "}
          <Link
            className="font-semibold text-[var(--terra-text)] underline decoration-[var(--line-strong)] underline-offset-4"
            href={footerLink.href}
          >
            {footerLink.label}
          </Link>
        </p>
      ) : null}
    </Card>
  );
}
