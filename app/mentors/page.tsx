import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { activeMentorProfiles } from "@/services/mentor-catalog/mentor-catalog";

export const metadata: Metadata = {
  title: "Mentors | MentorAndI",
  description: "Choose an active MentorAndI alpha mentor specialization.",
};

export default function MentorsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950 sm:py-14">
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

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {activeMentorProfiles.map((mentor) => (
            <Card
              className="flex h-full flex-col gap-5 p-6"
              key={mentor.slug}
              variant="bordered"
            >
              <div>
                <Heading level={3}>{mentor.name}</Heading>
                <Text className="mt-2">{mentor.shortDescription}</Text>
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
                <p className="text-sm font-semibold text-zinc-900">
                  Helps with
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {mentor.helpsWith.map((item) => (
                    <li
                      className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
                      key={item}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto border-t border-zinc-200 pt-4">
                <Text variant="small">
                  <span className="font-semibold text-zinc-900">Tone:</span>{" "}
                  {mentor.tone}
                </Text>
                <p className="mt-3 text-sm italic leading-6 text-zinc-600">
                  “{mentor.exampleOpeningLine}”
                </p>
                <Link
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
                  href={`/mentor?mentor=${mentor.slug}`}
                >
                  Choose {mentor.name}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
