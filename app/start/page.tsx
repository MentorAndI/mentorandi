import type { Metadata } from "next";
import Link from "next/link";

import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { ConversationCard } from "@/components/mentor/ConversationCard";
import { FirstConversationForm } from "@/components/mentor/FirstConversationForm";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

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
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <ConversationCard>
        <div className="space-y-8">
          <Heading
            className="max-w-xl text-4xl sm:text-5xl"
            id="first-conversation-heading"
            level={1}
          >
            Hi. I&apos;m glad you&apos;re here.
          </Heading>

          <div className="space-y-5">
            <Text className="text-lg leading-8 text-zinc-700">
              Before we begin...
            </Text>
            <Text className="text-lg leading-8 text-zinc-700">
              I&apos;d like to understand what brought you here today.
            </Text>
            <Text className="text-lg leading-8 text-zinc-700">
              There are no right or wrong answers.
            </Text>
            <Text className="text-lg leading-8 text-zinc-700">
              Just tell me whatever comes to mind.
            </Text>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
            <p className="font-semibold">A quick alpha guide</p>
            <p className="mt-1">
              Choose the mentor closest to your situation, write naturally,
              and use the Feedback button to tell us what helped or felt off. You
              can{" "}
              <Link
                className="font-semibold underline underline-offset-4"
                href="/mentors"
              >
                compare mentors
              </Link>{" "}
              before you begin.
            </p>
          </div>
        </div>

        <FirstConversationForm mentorSlug={mentor} />
      </ConversationCard>
      <FeedbackButton />
    </main>
  );
}
