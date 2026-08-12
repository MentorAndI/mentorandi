import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

export const metadata: Metadata = {
  title: "Onboarding | Mentor And I",
  description: "Start your Mentor And I onboarding.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedPlanValue = Array.isArray(params.plan)
    ? params.plan[0]
    : params.plan;
  const requestedPlan =
    requestedPlanValue &&
    ["free", "single", "plus", "premium"].includes(requestedPlanValue)
      ? requestedPlanValue
      : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-sky-50 py-16 text-zinc-950">
      <Container className="max-w-3xl">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12">
          <Badge variant="muted">Your first step</Badge>
          <Heading className="mt-5" level={1}>
            Let’s find the right place to begin
          </Heading>
          <Text className="mt-5 text-lg leading-8">
            New accounts start on the Free Trial with Life Mentor access. Tell
            us what you want support with by choosing the mentor experience
            closest to your situation.
          </Text>
          {requestedPlan ? (
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              Your selected plan preference is saved in this onboarding link,
              but it does not unlock paid access before a valid subscription
              exists.
            </p>
          ) : null}
          <Link
            className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-sky-950 px-6 text-sm font-semibold text-white transition hover:bg-sky-900"
            href="/mentors"
          >
            Continue to mentor selection
          </Link>
        </div>
      </Container>
    </main>
  );
}
