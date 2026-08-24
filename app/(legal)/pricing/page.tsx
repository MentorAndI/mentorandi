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
    description: "Start with Life Mentor and experience Mentor And I before choosing a paid plan.",
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
    description: "Use all main mentors when you want broader support across different parts of life.",
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
    description: "For more frequent mentoring, deeper sessions, and advanced long-term guidance.",
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
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-emerald-50 py-16 text-zinc-950">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge>Simple monthly plans</Badge>
          <Heading className="mt-5" level={1}>
            Choose the mentor access that fits you
          </Heading>
          <Text className="mx-auto mt-4 max-w-2xl text-lg">
            Start free with Life Mentor, choose one specialist, or unlock all
            main mentors with Mentor Plus or Premium. Paid plans are billed
            monthly and can be managed from your account.
          </Text>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <section
              className="flex rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm"
              key={plan.name}
            >
              <div className="flex w-full flex-col">
                <Heading level={2}>{plan.name}</Heading>
                <p className="mt-3 text-xl font-semibold text-zinc-950">
                  {plan.price}
                </p>
                <Text className="mt-3">{plan.description}</Text>
                <ul className="my-6 space-y-3 text-sm text-zinc-700">
                  {plan.features.map((feature) => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Link
                    className="block rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    href={`/signup?plan=${plan.plan}`}
                  >
                    {plan.plan === "free" ? "Start Free Trial" : "Choose plan"}
                  </Link>
                </div>
              </div>
            </section>
          ))}
        </div>
      </Container>
    </main>
  );
}
