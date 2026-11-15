import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Container } from "@/components/layout/Container";
import { MentorConversationClient } from "@/components/mentor/MentorConversationClient";
import { MentorPortrait } from "@/components/mentor/MentorPortrait";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { evaluateMentorAccess } from "@/services/mentor-access/mentor-access-policy";
import { MentorAccessService } from "@/services/mentor-access/mentor-access.service";
import {
  activeMentorProfiles,
  getActiveMentorProfile,
  getActiveMentorProfileByDatabaseSlug,
  getMentorDisplayName,
} from "@/services/mentor-catalog/mentor-catalog";
import { ConversationService } from "@/services/conversation/conversation.service";
import { UserService } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Mentors | Mentor And I",
  description: "Continue with the Mentor And I mentors included in your plan.",
};

export default async function MentorPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string; specialty?: string }>;
}) {
  const { mentor, specialty } = await searchParams;
  const currentUser = await new UserService().resolveOptionalAuthenticatedUser();
  const requestedMentor = getActiveMentorProfile(mentor ?? specialty);
  const entitlement = currentUser
    ? await new MentorAccessService().resolveEntitlement(currentUser.id)
    : null;

  if (!requestedMentor && currentUser && entitlement) {
    const recentConversations =
      await new ConversationService().getRecentConversationsForUser(
        currentUser.id,
        12,
      );

    const recentMentorOrder = recentConversations
      .map((conversation) =>
        getActiveMentorProfileByDatabaseSlug(conversation.mentor.slug),
      )
      .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile))
      .map((profile) => profile.slug);

    const includedMentors = activeMentorProfiles
      .filter((profile) =>
        evaluateMentorAccess({
          mentorSlug: profile.slug,
          plan: entitlement.plan,
          selectedMentorSlug: entitlement.selectedMentorSlug,
        }).allowed,
      )
      .sort((a, b) => {
        const aIndex = recentMentorOrder.indexOf(a.slug);
        const bIndex = recentMentorOrder.indexOf(b.slug);

        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        return aIndex - bIndex;
      });

    if (includedMentors.length > 1) {
      return (
        <main className="min-h-screen bg-[var(--app-bg)] py-4 text-[var(--ink)] sm:py-6">
          <Container className="max-w-7xl">
            <AccountNavigation />

            <div className="mb-8 max-w-2xl">
              <p className="font-meta text-[0.7rem] text-[var(--terra-text)]">
                MY MENTORS
              </p>
              <Heading className="mt-2" level={1}>
                Your mentor team
              </Heading>
              <Text className="mt-3 leading-7">
                These mentors are included in your current plan. Your most
                recently used mentors appear first.
              </Text>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {includedMentors.map((profile) => (
                <div
                  className="h-full"
                  key={profile.slug}
                  style={
                    {
                      "--h": `var(--mentor-${profile.slug})`,
                    } as CSSProperties
                  }
                >
                  <Card
                    className="mentor-card group flex h-full flex-col overflow-hidden p-0"
                    variant="bordered"
                  >
                    <MentorPortrait
                      className="relative h-48 w-full overflow-hidden border-b border-[var(--line)]"
                      name={profile.personaName}
                      portraitSrc={profile.portraitSrc}
                    />

                    <div className="flex flex-1 flex-col p-5">
                      <Heading level={3}>{profile.personaName}</Heading>
                      <p className="mentor-role-label mt-1 text-sm font-semibold">
                        {profile.name}
                      </p>
                      <Text className="mt-3 leading-6" variant="small">
                        {profile.shortDescription}
                      </Text>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <Link
                          className="text-sm font-semibold text-[var(--ink-muted)] underline decoration-[var(--line-strong)] underline-offset-4 transition hover:text-[var(--ink)]"
                          href={`/mentors/${profile.slug}`}
                        >
                          Profile
                        </Link>
                        <Link
                          className="inline-flex h-10 items-center justify-center rounded-[var(--r-md)] bg-[var(--terra-hover)] px-4 text-sm font-semibold text-[var(--on-terra)] transition hover:bg-[var(--terra-press)]"
                          href={`/mentor?mentor=${profile.slug}`}
                        >
                          Open mentor
                        </Link>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="text-sm font-semibold text-[var(--terra-text)] underline decoration-[var(--line-strong)] underline-offset-4"
                href="/mentors"
              >
                See more mentors
              </Link>
              <span className="text-[var(--line-strong)]">•</span>
              <Link
                className="text-sm font-semibold text-[var(--terra-text)] underline decoration-[var(--line-strong)] underline-offset-4"
                href="/pricing"
              >
                Compare plans
              </Link>
            </div>
          </Container>
        </main>
      );
    }
  }

  const recentConversation = !requestedMentor && currentUser
    ? (await new ConversationService().getRecentConversationsForUser(
        currentUser.id,
        1,
      ))[0] ?? null
    : null;

  const selectedMentor =
    requestedMentor ??
    (recentConversation
      ? getActiveMentorProfileByDatabaseSlug(recentConversation.mentor.slug)
      : null) ??
    getActiveMentorProfile("life");

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
