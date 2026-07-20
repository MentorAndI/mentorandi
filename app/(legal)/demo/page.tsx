import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { demoScenarios } from "@/services/demo/demo-scenarios";

export const metadata: Metadata = {
  title: "Investor Demo | MentorAndI",
  description:
    "See how one MentorAndI engine supports distinct, specialized AI mentor experiences.",
};

const platformFoundations = [
  {
    title: "Persistent accounts",
    description: "Secure sign-in keeps each person’s mentoring experience theirs.",
  },
  {
    title: "Conversation history",
    description:
      "People can return to earlier conversations, with separate threads for each mentor.",
  },
  {
    title: "Mentor specialization",
    description:
      "One Mentor Core adapts its expertise, tone, methods, and boundaries to the selected profile.",
  },
  {
    title: "Feedback capture",
    description:
      "Authenticated alpha users can rate usefulness and report product issues in context.",
  },
  {
    title: "Admin monitoring",
    description:
      "Allowlisted internal operators can review alpha activity and feedback; those tools are never linked publicly.",
  },
  {
    title: "Usage limits",
    description:
      "Service-layer guardrails help control alpha usage and model cost.",
  },
  {
    title: "Privacy and security foundation",
    description:
      "Server-side ownership checks keep accounts and conversations isolated, with no public database access.",
  },
];

export default function DemoPage() {
  return (
    <main className="flex-1 bg-zinc-50 py-10 text-zinc-950 sm:py-16">
      <Container className="max-w-6xl">
        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="warning">Private alpha · Demo environment</Badge>
          <Heading className="mt-5" level={1}>
            One mentoring engine. Specialized support for real life.
          </Heading>
          <Text className="mt-5 text-lg leading-8">
            MentorAndI is a long-term AI mentor platform, not a generic chat.
            One core engine powers multiple profiles designed around distinct
            needs—from ADHD and relationship patterns to confidence, burnout,
            and life direction.
          </Text>
          <Text className="mt-3" variant="muted">
            This is a private-alpha demonstration. It is not therapy, diagnosis,
            crisis support, or professional advice.
          </Text>
        </section>

        <section className="mt-14" aria-labelledby="demo-scenarios">
          <div className="max-w-2xl">
            <Heading id="demo-scenarios" level={2}>
              Try a mentor scenario
            </Heading>
            <Text className="mt-3">
              Choose a scenario to open the matching mentor, then use the demo
              prompt shown on its card. Each profile keeps its own conversation
              history.
            </Text>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {demoScenarios.map((scenario) => (
              <Card
                className="flex h-full flex-col gap-5 p-6"
                key={scenario.slug}
                variant="bordered"
              >
                <div>
                  <Badge variant="muted">Specialized profile</Badge>
                  <Heading className="mt-3" level={3}>
                    {scenario.mentorName}
                  </Heading>
                  <Text className="mt-2">{scenario.helpsWith}</Text>
                </div>

                <blockquote className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm italic leading-6 text-zinc-700">
                  “{scenario.prompt}”
                </blockquote>

                <Link
                  className="mt-auto inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                  href={`/mentor?mentor=${scenario.slug}`}
                >
                  Start with {scenario.mentorName}
                </Link>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="platform-foundation">
          <div className="max-w-2xl">
            <Heading id="platform-foundation" level={2}>
              Built for an ongoing mentor relationship
            </Heading>
            <Text className="mt-3">
              The demo sits on the same product foundation as the alpha
              experience—continuity for users, specialization for mentors, and
              operational safeguards for the team.
            </Text>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platformFoundations.map((foundation) => (
              <Card className="p-5" key={foundation.title} variant="bordered">
                <Heading level={4}>{foundation.title}</Heading>
                <Text className="mt-2" variant="small">
                  {foundation.description}
                </Text>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-xl bg-zinc-950 px-6 py-9 text-center text-white sm:px-10">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Explore the full alpha mentor lineup
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
            The active catalog also includes Parenting, Health &amp; Fitness,
            and Focus mentors, all using the same mentor-scoped conversation
            system.
          </p>
          <Link
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            href="/mentors"
          >
            View all mentors
          </Link>
        </section>
      </Container>
    </main>
  );
}
