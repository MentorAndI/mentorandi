import type { Metadata } from "next";

import { ConversationCard } from "@/components/mentor/ConversationCard";
import { JourneyStep } from "@/components/mentor/JourneyStep";

const headingId = "welcome-heading";

export const metadata: Metadata = {
  title: "Welcome | MentorAndI",
  description: "Welcome to the first mentoring conversation with Marcus.",
};

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <ConversationCard labelledBy={headingId}>
        <JourneyStep
          actionLabel="Start our first conversation"
          body={[
            "I'm looking forward to getting to know you.",
            "Over time I'll learn how you think, what motivates you and what tends to hold you back.",
            "We'll take this one step at a time.",
          ]}
          heading="Hi, I'm Marcus."
          headingId={headingId}
        />
      </ConversationCard>
    </main>
  );
}
