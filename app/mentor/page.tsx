import type { Metadata } from "next";
import Link from "next/link";

import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Container } from "@/components/layout/Container";
import { MentorConversationClient } from "@/components/mentor/MentorConversationClient";
import {
  getActiveMentorProfile,
  getMentorDisplayName,
} from "@/services/mentor-catalog/mentor-catalog";
import { MentorAccessService } from "@/services/mentor-access/mentor-access.service";
import { UserService } from "@/services/user/user.service";

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
  const currentUser = await new UserService().resolveOptionalAuthenticatedUser();
  const entitlement = currentUser
    ? await new MentorAccessService().resolveEntitlement(currentUser.id)
    : null;
  const isFreeTrial = entitlement?.plan === "free";

  return (
    <main className="min-h-screen bg-[var(--app-bg)] py-4 text-[var(--ink)] sm:py-6">
      <Container className="max-w-7xl">
        <AccountNavigation />
        {isFreeTrial ? (
          <div className="mb-4 flex flex-col gap-2 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--band)] px-4 py-3 text-sm leading-6 text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span>
              <span className="font-semibold text-[var(--ink)]">Free Trial:</span>{" "}
              Marcus is included. Specialist mentors are available on paid plans.
            </span>
            <Link
              className="shrink-0 font-semibold text-[var(--terra-text)] underline decoration-[var(--line-strong)] underline-offset-4"
              href="/pricing"
            >
              Upgrade
            </Link>
          </div>
        ) : null}
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
