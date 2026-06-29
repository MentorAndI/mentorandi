import type { Metadata } from "next";

import { ConversationCard } from "@/components/mentor/ConversationCard";
import {
  MentorRecommendation,
  MentorRecommendationCard,
} from "@/components/mentor/MentorRecommendationCard";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";

const headingId = "match-heading";

const recommendedMentor: MentorRecommendation = {
  description:
    "Marcus helps people think clearly, make better decisions and stay accountable over the long term.",
  name: "Marcus",
  role: "Strategic Mentor",
};

export const metadata: Metadata = {
  title: "Mentor Match | MentorAndI",
  description: "Meet the mentor recommended for this MentorAndI journey.",
};

export default function MatchPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <ConversationCard labelledBy={headingId}>
        <div className="space-y-8">
          <Heading
            className="max-w-xl text-4xl sm:text-5xl"
            id={headingId}
            level={1}
          >
            We&apos;ve found someone we&apos;d like you to meet.
          </Heading>
          <MentorRecommendationCard mentor={recommendedMentor} />
          <Button className="sm:min-w-40" href="/welcome">
            Meet Marcus
          </Button>
        </div>
      </ConversationCard>
    </main>
  );
}
