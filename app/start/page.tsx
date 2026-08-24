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
    <main className="min-h-screen bg-[var(--app-bg)] px-6 py-8 text-[var(--ink)] sm:py-12">
      <div className="mx-auto mb-5 flex w-full max-w-3xl items-center justify-between gap-4">
        <p className="font-serif text-xl font-medium tracking-[-0.02em] text-[var(--ink)]">
          Mentor <span className="text-[var(--terra-text)]">And I</span>
        </p>
        <Link
          className="text-sm font-semibold text-[var(--ink-muted)] transition hover:text-[var(--terra-text)]"
          href="/mentors"
        >
          Change mentor
        </Link>
      </div>

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
              Before we begin, I&apos;d like to understand what brought you here
              today.
            </Text>
            <Text className="text-lg leading-8">
              There are no right or wrong answers. Tell me what feels most
              important to start with.
            </Text>
          </div>
        </div>

        <FirstConversationForm mentorSlug={mentor} />
      </ConversationCard>
      <FeedbackButton mentorSlug={mentor} />
    </main>
  );
}
