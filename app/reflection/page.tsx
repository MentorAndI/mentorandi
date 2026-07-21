import type { Metadata } from "next";

import { ConversationCard } from "@/components/mentor/ConversationCard";
import { JourneyStep } from "@/components/mentor/JourneyStep";

const headingId = "reflection-heading";

export const metadata: Metadata = {
  title: "Reflection | Mentor And I",
  description: "A calm reflection step in the Mentor And I journey.",
};

export default function ReflectionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <ConversationCard labelledBy={headingId}>
        <JourneyStep
          actionHref="/match"
          actionLabel="Continue"
          body={[
            "Based on what you've shared, we've started building an understanding of what matters most to you.",
            "This isn't a personality test.",
            "It's simply the beginning of getting to know you.",
          ]}
          heading="Thank you."
          headingId={headingId}
        />
      </ConversationCard>
    </main>
  );
}
