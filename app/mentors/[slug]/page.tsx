import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-sky-50 py-10 text-zinc-950 sm:py-16">
      <Container className="max-w-5xl">
        <Link
          className="text-sm font-semibold text-sky-950 hover:text-sky-700"
          href="/mentors"
        >
          ← All mentors
        </Link>

        <div className="mt-8 grid overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          <MentorPortrait
            className="relative aspect-[4/5] w-full self-start overflow-hidden"
            name={mentor.personaName}
            portraitSrc={mentor.profilePortraitSrc ?? mentor.portraitSrc}
            priority
          />

          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
            <Badge className="self-start" variant="muted">
              {mentor.name}
            </Badge>
            <Heading className="mt-5" level={1}>
              Meet {mentor.personaName}
            </Heading>
            <Text className="mt-5 text-lg leading-8">
              {mentor.shortDescription}
            </Text>
            <p className="mt-6 text-sm font-semibold text-zinc-900">
              A good fit if you’re looking for
            </p>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700 sm:grid-cols-2">
              {mentor.helpsWith.map((item) => (
                <li className="flex gap-2" key={item}>
                  <span aria-hidden="true" className="text-sky-700">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              className="mt-8 inline-flex h-12 items-center justify-center self-start rounded-lg bg-sky-950 px-6 text-sm font-semibold text-white transition hover:bg-sky-900"
              href={`/start?mentor=${mentor.slug}`}
            >
              Start intake with {mentor.personaName}
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-7">
            <Heading level={3}>How {mentor.personaName} helps</Heading>
            <Text className="mt-4">{mentor.whoThisIsFor}</Text>
            <div className="mt-5 flex flex-wrap gap-2">
              {mentor.cardTags.map((tag) => (
                <span
                  className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-900"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-7">
            <Heading level={3}>What to expect</Heading>
            <Text className="mt-4">{mentor.tone}</Text>
            {mentor.cardBoundary ? (
              <p className="mt-5 rounded-lg bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
                {mentor.cardBoundary}
              </p>
            ) : null}
          </section>
        </div>
      </Container>
    </main>
  );
}
