import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { activeMentorProfiles } from "@/services/mentor-catalog/mentor-catalog";

export const metadata: Metadata = {
  title: "Mentors | Mentor And I",
  description: "Choose an active Mentor And I alpha mentor specialization.",
};

export default function MentorsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-sky-50 py-12 text-zinc-950 sm:py-16">
      <Container className="max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="muted">Alpha preview</Badge>
          <Heading className="mt-4" level={1}>
            Choose the kind of support you need
          </Heading>
          <Text className="mt-4 text-lg leading-8">
            Every mentor uses the same secure Mentor Core and your existing
            context, with a distinct profile, emphasis, methods, and safety
            boundaries. During alpha, selections continue in the existing
            conversation system.
          </Text>
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-sky-200 bg-sky-50 p-4 text-center text-sm leading-6 text-sky-950">
          <span className="font-semibold">First time here?</span> Choose the
          mentor closest to your situation, write as naturally as you would to
          a thoughtful person, and use the Feedback button after chatting to
          help improve the alpha.
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {activeMentorProfiles.map((mentor) => (
            <Card
              className="flex h-full flex-col gap-6 rounded-2xl bg-white p-7 shadow-sm"
              key={mentor.slug}
              variant="bordered"
            >
              <div>
                <Heading level={3}>{mentor.cardName}</Heading>
                <Text className="mt-3 leading-7">{mentor.shortDescription}</Text>
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Who this is for
                </p>
                <Text className="mt-1" variant="small">
                  {mentor.whoThisIsFor}
                </Text>
              </div>

              <div>
                <ul aria-label={`${mentor.cardName} focus areas`} className="flex flex-wrap gap-2">
                  {mentor.cardTags.map((item) => (
                    <li
                      className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
                      key={item}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                {mentor.cardBoundary ? (
                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    {mentor.cardBoundary}
                  </p>
                ) : null}
              </div>

              <div className="mt-auto border-t border-zinc-200 pt-4">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-sky-950 px-5 text-sm font-semibold text-white transition hover:bg-sky-900"
                  href={`/mentor?mentor=${mentor.slug}`}
                >
                  Start with this mentor
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
