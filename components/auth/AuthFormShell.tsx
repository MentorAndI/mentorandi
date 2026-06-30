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
    <Card className="w-full max-w-md space-y-8 p-6 sm:p-8" variant="bordered">
      <div className="space-y-3">
        <Heading level={1}>{title}</Heading>
        <Text className="text-zinc-600">{description}</Text>
      </div>

      {children}

      {footerLink ? (
        <p className="text-center text-sm text-zinc-600">
          {footerLink.text}{" "}
          <Link
            className="font-medium text-zinc-950 underline underline-offset-4"
            href={footerLink.href}
          >
            {footerLink.label}
          </Link>
        </p>
      ) : null}
    </Card>
  );
}
