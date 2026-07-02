import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { MentorConversationClient } from "@/components/mentor/MentorConversationClient";

export const metadata: Metadata = {
  title: "Mentor | MentorAndI",
  description: "Continue your conversation with your MentorAndI mentor.",
};

export default function MentorPage() {
  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-6xl">
        <MentorConversationClient />
      </Container>
    </main>
  );
}
