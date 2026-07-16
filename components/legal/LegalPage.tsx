import type { ReactNode } from "react";

import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

export interface LegalPageProps {
  children: ReactNode;
  description: string;
  title: string;
}

export function LegalPage({
  children,
  description,
  title,
}: LegalPageProps) {
  return (
    <main className="flex-1 bg-zinc-50 py-12 text-zinc-950 sm:py-16">
      <Container className="max-w-3xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-10">
          <div className="border-b border-zinc-200 pb-7">
            <Text className="font-medium uppercase tracking-[0.18em]" variant="muted">
              Alpha information
            </Text>
            <Heading className="mt-3" level={1}>
              {title}
            </Heading>
            <Text className="mt-4 text-lg leading-8">{description}</Text>
          </div>
          <div className="mt-8 space-y-8">{children}</div>
        </div>
      </Container>
    </main>
  );
}

export function LegalSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <Heading level={3}>{title}</Heading>
      <div className="space-y-3 text-base leading-7 text-zinc-700">
        {children}
      </div>
    </section>
  );
}
