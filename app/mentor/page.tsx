import type { Metadata } from "next";

import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Container } from "@/components/layout/Container";
import { MentorConversationClient } from "@/components/mentor/MentorConversationClient";
import {
  getActiveMentorProfile,
  getMentorDisplayName,
} from "@/services/mentor-catalog/mentor-catalog";

export const metadata: Metadata = {
  title: "Mentor | Mentor And I",
  description: "Continue your conversation with your Mentor And I mentor.",
};

export default async function MentorPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string; specialty?: string }>;
}) {
  const { mentor, specialty } = await searchParams;
  const selectedMentor =
    getActiveMentorProfile(mentor ?? specialty) ??
    getActiveMentorProfile("life");

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
          key={selectedMentor?.slug ?? "life"}
          selectedMentor={{
            name: selectedMentor
              ? getMentorDisplayName(selectedMentor)
              : "Marcus",
            portraitSrc:
              selectedMentor?.portraitSrc ?? "/images/mentors/marcus.png",
            role: selectedMentor?.name ?? "Life Mentor",
            slug: selectedMentor?.slug ?? "life",
            tagline:
              selectedMentor?.shortDescription ??
              "Personal clarity, honest reflection, and sustainable change.",
          }}
        />
        <FeedbackButton />
      </Container>
    </main>
  );
}
