import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { MentorTestClient } from "@/app/dev/mentor-test/MentorTestClient";

export const metadata: Metadata = {
  title: "Mentor Pipeline Test | MentorAndI",
  description: "Local development tool for testing Mentor Core responses.",
};

export default function DevMentorTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-50 py-12 text-zinc-950">
      <Container className="max-w-5xl">
        <div className="mb-8 max-w-2xl space-y-3">
          <Heading level={1}>Mentor Pipeline Test</Heading>
          <Text>
            Send a local test message through the persisted Mentor Core flow.
          </Text>
        </div>

        <MentorTestClient />
      </Container>
    </main>
  );
}
