import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

export const metadata: Metadata = {
  title: "Pricing | Mentor And I",
  description: "Choose the Mentor And I plan that fits the support you want.",
};

const plans = [
  {
    description:
      "Start with Life Mentor and experience Mentor And I before choosing a paid plan.",
    features: [
      "Life Mentor access",
      "Limited starter usage",
      "No card required",
    ],
    name: "Free Trial",
    plan: "free",
    price: "$0",
  },
  {
    description: "Choose one specialist mentor for focused, ongoing guidance.",
    features: [
      "Life Mentor plus one specialist mentor",
      "Persistent mentor history and context",
      "Ongoing monthly access",
    ],
    name: "Single Mentor",
    plan: "single",
    price: "$19/month",
  },
  {
    description:
      "Use all main mentors when you want broader support across different parts of life.",
    features: [
      "All main mentors",
      "Persistent mentor history and context",
      "Limited deep mentor sessions",
    ],
    name: "Mentor Plus",
    plan: "plus",
    price: "$39/month",
  },
  {
    description:
      "For more frequent mentoring, deeper sessions, and advanced long-term guidance.",
    features: [
      "All main mentors",
      "More deep mentor sessions",
      "Advanced and long-term mentor programs",
    ],
    name: "Premium",
    plan: "premium",
    price: "$69/month",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] py-10 text-[var(--ink)] sm:py-14">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <Badge variant="muted">Plans & access</Badge>
            <Heading className="mt-5 font-editorial" level={1}>
              Choose the access that fits you
            </Heading>
            <Text className="mt-4 max-w-xl text-base leading-7 text-[var(--ink-muted)] sm:text-lg">
              Start free, work with one specialist mentor, or unlock the full
              mentor team. Paid plans are billed monthly and can be managed
              from your account.
            </Text>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const isPremium = plan.plan === "premium";

              return (
                <section
                  className={`flex min-h-full rounded-[var(--r-card)] border p-6 shadow-[var(--shadow-soft)] ${
                    isPremium
                      ? "border-[color-mix(in_srgb,var(--terra)_55%,var(--line))] bg-[color-mix(in_srgb,var(--terra)_5%,var(--surface-raised))]"
                      : "border-[var(--line)] bg-[var(--surface-raised)]"
                  }`}
                  key={plan.name}
                >
                  <div className="flex w-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <Heading className="text-2xl" level={2}>
                        {plan.name}
                      </Heading>
                      {isPremium ? (
                        <Badge className="shrink-0">Most access</Badge>
                      ) : null}
                    </div>

                    <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--ink)]">
                      {plan.price}
                    </p>
                    <Text className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
                      {plan.description}
                    </Text>

                    <ul className="my-6 space-y-3 text-sm leading-6 text-[var(--ink-muted)]">
                      {plan.features.map((feature) => (
                        <li className="flex gap-2" key={feature}>
                          <span
                            aria-hidden="true"
                            className="mt-[0.15rem] font-semibold text-[var(--terra-text)]"
                          >
                            ✓
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-2">
                      <Link
                        className={`block rounded-[var(--r-control)] px-4 py-3 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-raised)] ${
                          isPremium || plan.plan === "free"
                            ? "bg-[var(--terra)] text-[var(--on-terra)] hover:bg-[var(--terra-hover)]"
                            : "border border-[var(--line-strong)] bg-[var(--surface-raised)] text-[var(--ink)] hover:bg-[var(--band)]"
                        }`}
                        href={`/signup?plan=${plan.plan}`}
                      >
                        {plan.plan === "free" ? "Start free" : "Choose plan"}
                      </Link>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          <p className="mt-6 text-sm leading-6 text-[var(--ink-faint)]">
            Need more usage later? Credit top-ups can be added from your account
            without changing your plan.
          </p>
        </div>
      </Container>
    </main>
  );
}
