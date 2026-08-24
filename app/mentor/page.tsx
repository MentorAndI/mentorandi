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

const appLinks = [
  { href: "/mentor", label: "Mentor" },
  { href: "/mentors", label: "Mentors" },
  { href: "/credits", label: "Credits" },
  { href: "/settings", label: "Settings" },
];

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
    <main className="min-h-screen bg-[var(--app-bg)] py-4 text-[var(--ink)] sm:py-6">
      <Container className="max-w-7xl">
        <AccountNavigation links={appLinks} />
        <MentorConversationClient
          key={selectedMentor?.slug ?? "life"}
          selectedMentor={{
            name: selectedMentor
              ? getMentorDisplayName(selectedMentor)
              : "Marcus",
            portraitSrc: selectedMentor?.portraitSrc ?? null,
            role: selectedMentor?.name ?? "Life Mentor",
            slug: selectedMentor?.slug ?? "life",
            tagline:
              selectedMentor?.shortDescription ??
              "Personal clarity, honest reflection, and sustainable change.",
          }}
        />
        <FeedbackButton mentorSlug={selectedMentor?.slug} />
      </Container>
    </main>
  );
}
