import type { Metadata } from "next";
import Link from "next/link";

import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Container } from "@/components/layout/Container";
import { ConversationCard } from "@/components/mentor/ConversationCard";
import { FirstConversationForm } from "@/components/mentor/FirstConversationForm";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { evaluateMentorAccess } from "@/services/mentor-access/mentor-access-policy";
import { MentorAccessService } from "@/services/mentor-access/mentor-access.service";
import {
  getActiveMentorProfile,
  getMentorDisplayName,
} from "@/services/mentor-catalog/mentor-catalog";
import { UserService } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Start | Mentor And I",
  description: "Begin your first conversation with Mentor And I.",
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string }>;
}) {
  const { mentor } = await searchParams;
  const currentUser = await new UserService().resolveOptionalAuthenticatedUser();
  const entitlement = currentUser
    ? await new MentorAccessService().resolveEntitlement(currentUser.id)
    : null;
  const requestedMentor =
    getActiveMentorProfile(mentor) ?? getActiveMentorProfile("life");
  const requestedSlug = requestedMentor?.slug ?? "life";
  const accessDecision = entitlement
    ? evaluateMentorAccess({
        mentorSlug: requestedSlug,
        plan: entitlement.plan,
        selectedMentorSlug: entitlement.selectedMentorSlug,
      })
    : null;
  const canClaimSingleSpecialist =
    entitlement?.plan === "single_mentor" &&
    !entitlement.selectedMentorSlug &&
    requestedSlug !== "life";
  const canUseRequestedMentor =
    !entitlement || Boolean(accessDecision?.allowed) || canClaimSingleSpecialist;
  const isFreeTrial = entitlement?.plan === "free";

  return (
    <main className="min-h-screen bg-[var(--app-bg)] py-4 text-[var(--ink)] sm:py-6">
      <Container className="max-w-7xl">
        <AccountNavigation />

        <div className="mx-auto max-w-3xl">
          <ConversationCard>
            <div className="space-y-7">
              <div>
                <p className="font-meta text-[0.7rem] text-[var(--terra-text)]">
                  FIRST CONVERSATION
                </p>
                <Heading
                  className="mt-3 max-w-xl font-serif text-4xl font-medium sm:text-5xl"
                  id="first-conversation-heading"
                  level={1}
                >
                  Hi. I&apos;m glad you&apos;re here.
                </Heading>
              </div>

              <div className="max-w-2xl space-y-3">
                <Text className="text-lg leading-8">
                  Before we begin, I&apos;d like to understand what brought you
                  here today.
                </Text>
                <Text className="text-lg leading-8">
                  There are no right or wrong answers. Tell me what feels most
                  important to start with.
                </Text>
              </div>
            </div>

            {!canUseRequestedMentor && requestedMentor ? (
              <section className="mt-8 rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--band)] p-5">
                <p className="font-meta text-[0.68rem] text-[var(--terra-text)]">
                  SPECIALIST MENTOR
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">
                  {getMentorDisplayName(requestedMentor)} requires an upgrade
                </h2>
                <Text className="mt-2 leading-7">
                  Your current plan includes Marcus, your Life Mentor. Upgrade
                  to work with {getMentorDisplayName(requestedMentor)} or choose
                  a plan with access to more specialist mentors.
                </Text>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button href="/pricing">View upgrade options</Button>
                  <Button href="/start?mentor=life" variant="secondary">
                    Continue with Marcus
                  </Button>
                </div>
              </section>
            ) : (
              <>
                {isFreeTrial ? (
                  <div className="mt-8 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--band)] px-4 py-3 text-sm leading-6 text-[var(--ink-muted)]">
                    <span className="font-semibold text-[var(--ink)]">
                      Free Trial:
                    </span>{" "}
                    Marcus, your Life Mentor, is included. Specialist mentors are
                    available on paid plans.{" "}
                    <Link
                      className="font-semibold text-[var(--terra-text)] underline decoration-[var(--line-strong)] underline-offset-4"
                      href="/pricing"
                    >
                      View upgrade options
                    </Link>
                    .
                  </div>
                ) : null}

                <FirstConversationForm
                  isAuthenticated={Boolean(currentUser)}
                  mentorSlug={requestedSlug}
                />
              </>
            )}
          </ConversationCard>
        </div>

        <FeedbackButton mentorSlug={requestedSlug} />
      </Container>
    </main>
  );
}
