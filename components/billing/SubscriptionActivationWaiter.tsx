"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

const pollingIntervalMs = 2_000;
const pollingAttempts = 30;

export function SubscriptionActivationWaiter({ plan }: { plan: string }) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let canceled = false;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function checkVerifiedSubscription() {
      attempts += 1;

      try {
        const response = await fetch("/api/billing/status", {
          cache: "no-store",
        });
        const body = (await response.json()) as {
          hasActivePaidSubscription?: boolean;
        };

        if (!canceled && body.hasActivePaidSubscription) {
          window.location.replace("/mentors");
          return;
        }
      } catch {
        // A transient status failure is retried without treating the return
        // query as proof that payment or entitlement exists.
      }

      if (canceled) return;

      if (attempts >= pollingAttempts) {
        setTimedOut(true);
        return;
      }

      timeoutId = setTimeout(checkVerifiedSubscription, pollingIntervalMs);
    }

    void checkVerifiedSubscription();

    return () => {
      canceled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div aria-live="polite">
      <Badge variant="muted">Verifying subscription</Badge>
      <Heading className="mt-5" level={1}>
        Your secure payment has returned
      </Heading>
      <Text className="mt-5 text-lg leading-8">
        We’re waiting for Stripe’s verified subscription update. As soon as it
        arrives, you’ll continue to mentor selection automatically.
      </Text>
      <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950">
        {timedOut ? (
          <>
            Verification is taking longer than usual. No additional checkout
            has been started. You can{" "}
            <Link
              className="font-semibold underline"
              href={`/onboarding?plan=${encodeURIComponent(plan)}&checkout=returned`}
            >
              check again
            </Link>{" "}
            or visit your settings for billing support.
          </>
        ) : (
          "Checking your verified subscription status…"
        )}
      </div>
    </div>
  );
}
