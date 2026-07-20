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

const investorProofPoints = [
  "One mentor engine, specialized mentor profiles.",
  "Persistent user accounts and conversation history.",
  "Separate mentor contexts.",
  "Feedback loop for alpha improvement.",
  "Usage limits and security hardening in place.",
];

const demoSteps = [
  {
    action: "Open mentor lineup",
    description:
      "Start with the active mentor catalog and explain that every profile runs on the same Mentor Core.",
    href: "/mentors",
    title: "Show the mentor lineup",
  },
  {
    action: "Open ADHD Mentor",
    description:
      "Choose the ADHD profile to show non-shaming, executive-function-focused positioning.",
    href: "/mentor?mentor=adhd",
    title: "Choose the ADHD Mentor",
  },
  {
    description:
      "Enter: “I keep avoiding an important task even though I know I need to do it.”",
    title: "Use the task-avoidance prompt",
  },
  {
    description:
      "Point out the profile-specific tone, practical next step, and continuity from the user’s account context.",
    title: "Show the mentor response",
  },
  {
    action: "Open Confidence Mentor",
    description:
      "Switch profiles and use the confidence prompt to demonstrate a distinct mentoring emphasis.",
    href: "/mentor?mentor=confidence",
    title: "Switch to the Confidence Mentor",
  },
  {
    description:
      "Show that the ADHD thread does not appear in Confidence. Each mentor loads its own persisted conversation.",
    title: "Show the separate context",
  },
  {
    description:
      "Show the authenticated feedback control. Explain that feedback review and monitoring are restricted to allowlisted internal admins—there is no public admin link.",
    title: "Explain the alpha feedback loop",
  },
  {
    action: "View privacy foundation",
    description:
      "Close with usage guardrails, server-side ownership checks, private data access, and the public privacy, terms, and contact foundation.",
    href: "/privacy",
    title: "Explain safeguards and staging",
  },
];

const whatThisProves = [
  {
    description:
      "The experience is organized around ongoing mentoring, memory, goals, reflection, and continuity—not an open-ended assistant box.",
    title: "Not a generic chatbot",
  },
  {
    description:
      "ADHD, Confidence, Relationship, Stress / Burnout, and Life use distinct positioning, expertise, tone, and boundaries.",
    title: "Mentor specialization works",
  },
  {
    description:
      "Authenticated users can return to their prior conversations instead of starting from zero each time.",
    title: "User history persists",
  },
  {
    description:
      "Switching mentor profiles loads a separate persisted thread and prevents histories from being mixed.",
    title: "Mentor conversations are separated",
  },
  {
    description:
      "Authenticated users can submit in-context usefulness and product feedback for internal alpha review.",
    title: "Alpha feedback is captured",
  },
  {
    description:
      "The investor flow is available in the deployed VPS staging environment behind HTTPS health monitoring.",
    title: "Infrastructure runs on VPS staging",
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

        <section className="mt-10" aria-label="Investor summary">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {investorProofPoints.map((point) => (
              <li
                className="rounded-lg border border-zinc-200 bg-white px-4 py-4 text-sm font-medium leading-6 text-zinc-800"
                key={point}
              >
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section
          className="mt-16 rounded-xl border border-zinc-200 bg-white p-6 sm:p-8"
          aria-labelledby="demo-script"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <Badge variant="success">5–7 minute run-of-show</Badge>
              <Heading className="mt-4" id="demo-script" level={2}>
                Investor demo script
              </Heading>
              <Text className="mt-3">
                Follow these eight steps in order. Use one prepared alpha account
                so persisted history and mentor separation are visible.
              </Text>
            </div>
            <Link
              className="text-sm font-semibold text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-950"
              href="#demo-scenarios"
            >
              Jump to demo prompts
            </Link>
          </div>

          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {demoSteps.map((step, index) => (
              <li
                className="flex gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-5"
                key={step.title}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-zinc-950">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {step.description}
                  </p>
                  {step.href ? (
                    <Link
                      className="mt-3 inline-flex text-sm font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900"
                      href={step.href}
                    >
                      {step.action}
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
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

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Relevant method frames
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {scenario.methodExamples.map((method) => (
                      <li
                        className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                        key={method}
                      >
                        {method}
                      </li>
                    ))}
                  </ul>
                </div>

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

        <section className="mt-16" aria-labelledby="what-this-proves">
          <div className="max-w-2xl">
            <Heading id="what-this-proves" level={2}>
              What this proves
            </Heading>
            <Text className="mt-3">
              The walkthrough demonstrates working product foundations, without
              invented usage, customer, or performance metrics.
            </Text>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {whatThisProves.map((proof) => (
              <Card className="p-5" key={proof.title} variant="bordered">
                <Heading level={4}>{proof.title}</Heading>
                <Text className="mt-2" variant="small">
                  {proof.description}
                </Text>
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
