import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import {
  activeMentorProfiles,
  getActiveMentorProfile,
} from "@/services/mentor-catalog/mentor-catalog";
import { UserService, UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feedback | Mentor And I",
  description: "Share private alpha feedback with the Mentor And I team.",
  robots: {
    follow: false,
    index: false,
  },
};

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    context?: string | string[];
    mentor?: string | string[];
  }>;
}) {
  try {
    await new UserService().resolveAuthenticatedUser();
  } catch (error) {
    if (error instanceof UserServiceError && error.statusCode === 401) {
      redirect("/login?next=%2Ffeedback");
    }

    throw error;
  }

  const params = await searchParams;
  const context = readFirstValue(params.context)?.slice(0, 500) || "/feedback";
  const requestedMentor = readFirstValue(params.mentor);
  const mentorSlug = getActiveMentorProfile(requestedMentor)?.slug;

  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-3xl">
        <AccountNavigation
          links={[
            { href: "/mentor", label: "Mentor" },
            { href: "/settings", label: "Settings" },
          ]}
        />
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 space-y-3">
            <Heading level={1}>Share alpha feedback</Heading>
            <Text>
              Report a bug, confusing moment, mentor-quality issue, onboarding
              problem, pricing question, or anything else we should improve.
              Your submission is private to you and the internal review team.
            </Text>
          </div>

          <FeedbackForm
            initialMentorSlug={mentorSlug}
            initialPagePath={context}
            mentorOptions={activeMentorProfiles.map((mentor) => ({
              label: mentor.name,
              value: mentor.slug,
            }))}
          />
        </div>
      </Container>
    </main>
  );
}

function readFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
