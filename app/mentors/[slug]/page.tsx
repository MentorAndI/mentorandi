import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { Container } from "@/components/layout/Container";
import { MentorPortrait } from "@/components/mentor/MentorPortrait";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import {
  activeMentorProfiles,
  getActiveMentorProfile,
} from "@/services/mentor-catalog/mentor-catalog";

interface MentorProfilePageProps {
  params: Promise<{ slug: string }>;
}

const appLinks = [
  { href: "/mentor", label: "Mentor" },
  { href: "/mentors", label: "Mentors" },
  { href: "/credits", label: "Credits" },
  { href: "/settings", label: "Settings" },
];

export function generateStaticParams() {
  return activeMentorProfiles.map((mentor) => ({ slug: mentor.slug }));
}

export async function generateMetadata({
  params,
}: MentorProfilePageProps): Promise<Metadata> {
  const mentor = getActiveMentorProfile((await params).slug);

  if (!mentor) {
    return {};
  }

  return {
    description: mentor.shortDescription,
    title: `${mentor.personaName}, ${mentor.name} | Mentor And I`,
  };
}

export default async function MentorProfilePage({
  params,
}: MentorProfilePageProps) {
  const mentor = getActiveMentorProfile((await params).slug);

  if (!mentor) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--app-bg)] py-4 text-[var(--ink)] sm:py-6">
      <Container className="max-w-7xl">
        <AccountNavigation links={appLinks} />

        <Link
          className="text-sm font-semibold text-[var(--ink-muted)] transition hover:text-[var(--terra-text)]"
          href="/mentors"
        >
          ← Back to mentors
        </Link>

        <div className="mt-5 grid overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] lg:grid-cols-[360px_1fr]">
          <MentorPortrait
            className="relative min-h-80 w-full overflow-hidden lg:min-h-full"
            name={mentor.personaName}
            portraitSrc={mentor.profilePortraitSrc ?? mentor.portraitSrc}
            priority
          />

          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
            <Badge className="self-start" variant="muted">
              {mentor.name}
            </Badge>
            <Heading className="mt-4" level={1}>
              {mentor.personaName}
            </Heading>
            <Text className="mt-4 max-w-2xl text-lg leading-8">
              {mentor.shortDescription}
            </Text>

            <div className="mt-6 flex flex-wrap gap-2">
              {mentor.cardTags.map((tag) => (
                <span
                  className="rounded-[var(--r-pill)] bg-[var(--band)] px-3 py-1 text-sm text-[var(--ink-muted)]"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>

            <Link
              className="mt-8 inline-flex h-11 items-center justify-center self-start rounded-[var(--r-md)] bg-[var(--terra-hover)] px-5 text-sm font-semibold text-[var(--on-terra)] transition hover:bg-[var(--terra-press)]"
              href={`/start?mentor=${mentor.slug}`}
            >
              Work with {mentor.personaName}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow-sm)]">
            <Heading level={3}>Good to bring to {mentor.personaName}</Heading>
            <Text className="mt-4">{mentor.whoThisIsFor}</Text>
            <ul className="mt-5 space-y-2 text-sm leading-6 text-[var(--ink-muted)]">
              {mentor.helpsWith.map((item) => (
                <li className="flex gap-3" key={item}>
                  <span aria-hidden="true" className="text-[var(--terra-text)]">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow-sm)]">
            <Heading level={3}>Working style</Heading>
            <Text className="mt-4">{mentor.tone}</Text>
            {mentor.cardBoundary ? (
              <p className="mt-5 rounded-[var(--r-md)] bg-[var(--band)] p-4 text-sm leading-6 text-[var(--ink-muted)]">
                {mentor.cardBoundary}
              </p>
            ) : null}
          </section>
        </div>
      </Container>
    </main>
  );
}
