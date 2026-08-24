import type { Metadata } from "next";
import Link from "next/link";

import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { Container } from "@/components/layout/Container";
import { MentorPortrait } from "@/components/mentor/MentorPortrait";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { activeMentorProfiles } from "@/services/mentor-catalog/mentor-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentors | Mentor And I",
  description: "Choose the mentor you want to work with.",
};

const appLinks = [
  { href: "/mentor", label: "Mentor" },
  { href: "/mentors", label: "Mentors" },
  { href: "/credits", label: "Credits" },
  { href: "/settings", label: "Settings" },
];

export default function MentorsPage() {
  return (
    <main className="min-h-screen bg-[var(--app-bg)] py-4 text-[var(--ink)] sm:py-6">
      <Container className="max-w-7xl">
        <AccountNavigation links={appLinks} />

        <div className="mb-8 max-w-2xl">
          <p className="font-meta text-[0.7rem] text-[var(--terra-text)]">
            YOUR MENTORS
          </p>
          <Heading className="mt-2" level={1}>
            Choose a mentor
          </Heading>
          <Text className="mt-3 leading-7">
            Pick the person best suited to what you want to work on now. Your
            Mentor And I context stays with you when you move between mentors.
          </Text>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeMentorProfiles.map((mentor) => (
            <Card
              className="group flex h-full flex-col overflow-hidden p-0"
              key={mentor.slug}
              variant="bordered"
            >
              <MentorPortrait
                className="relative h-48 w-full overflow-hidden border-b border-[var(--line)]"
                name={mentor.personaName}
                portraitSrc={mentor.portraitSrc}
              />

              <div className="flex flex-1 flex-col p-5">
                <div>
                  <Heading level={3}>{mentor.personaName}</Heading>
                  <p className="mt-1 text-sm font-semibold text-[var(--terra-text)]">
                    {mentor.name}
                  </p>
                  <Text className="mt-3 leading-6" variant="small">
                    {mentor.shortDescription}
                  </Text>
                </div>

                <ul
                  aria-label={`${mentor.cardName} focus areas`}
                  className="mt-4 flex flex-wrap gap-1.5"
                >
                  {mentor.cardTags.slice(0, 3).map((item) => (
                    <li
                      className="rounded-[var(--r-pill)] bg-[var(--band)] px-2.5 py-1 text-xs text-[var(--ink-muted)]"
                      key={item}
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <Link
                    className="text-sm font-semibold text-[var(--ink-muted)] underline decoration-[var(--line-strong)] underline-offset-4 transition hover:text-[var(--ink)]"
                    href={`/mentors/${mentor.slug}`}
                  >
                    Profile
                  </Link>
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-[var(--r-md)] bg-[var(--terra-hover)] px-4 text-sm font-semibold text-[var(--on-terra)] transition hover:bg-[var(--terra-press)]"
                    href={`/start?mentor=${mentor.slug}`}
                  >
                    Choose {mentor.personaName}
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
