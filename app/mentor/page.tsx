import type { Metadata } from "next";

import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Container } from "@/components/layout/Container";
import { MentorConversationClient } from "@/components/mentor/MentorConversationClient";
import { getActiveMentorProfile } from "@/services/mentor-catalog/mentor-catalog";

export const metadata: Metadata = {
  title: "Mentor | MentorAndI",
  description: "Continue your conversation with your MentorAndI mentor.",
};

export default async function MentorPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string }>;
}) {
  const { specialty } = await searchParams;
  const selectedMentor = getActiveMentorProfile(specialty);

  return (
    <main className="min-h-screen bg-zinc-50 py-6 text-zinc-950 sm:py-10">
      <Container className="max-w-6xl">
        <AccountNavigation
          links={[
            { href: "/mentor", label: "Mentor" },
            { href: "/mentors", label: "Specializations" },
            { href: "/settings", label: "Settings" },
          ]}
        />
        <MentorConversationClient
          selectedMentor={
            selectedMentor
              ? {
                  name: selectedMentor.name,
                  role: "Alpha specialization",
                  slug: selectedMentor.slug,
                  tagline: selectedMentor.shortDescription,
                }
              : undefined
          }
        />
        <FeedbackButton />
      </Container>
    </main>
  );
}
