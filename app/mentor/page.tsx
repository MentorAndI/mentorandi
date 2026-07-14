import type { Metadata } from "next";

import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Container } from "@/components/layout/Container";
import { MentorConversationClient } from "@/components/mentor/MentorConversationClient";

export const metadata: Metadata = {
  title: "Mentor | MentorAndI",
  description: "Continue your conversation with your MentorAndI mentor.",
};

export default function MentorPage() {
  return (
    <main className="min-h-screen bg-zinc-50 py-6 text-zinc-950 sm:py-10">
      <Container className="max-w-6xl">
        <AccountNavigation
          links={[
            { href: "/mentor", label: "Mentor" },
            { href: "/settings", label: "Settings" },
          ]}
        />
        <MentorConversationClient />
        <FeedbackButton />
      </Container>
    </main>
  );
}
