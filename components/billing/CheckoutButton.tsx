"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  enabled: boolean;
  plan: "SINGLE" | "PLUS" | "PREMIUM";
}

const planLabels = {
  PLUS: "Mentor Plus — $39/month",
  PREMIUM: "Premium — $69/month",
  SINGLE: "Single Mentor — $19/month",
} as const;

const publicPlanKeys = {
  PLUS: "plus",
  PREMIUM: "premium",
  SINGLE: "single",
} as const;

export function CheckoutButton({ enabled, plan }: CheckoutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function beginCheckout() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        body: JSON.stringify({ plan }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json()) as { error?: string; url?: string };

      if (response.status === 401) {
        const nextPath = `/onboarding?plan=${publicPlanKeys[plan]}`;
        window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      if (!response.ok || !body.url) {
        throw new Error(body.error ?? "Checkout is temporarily unavailable.");
      }

      window.location.assign(body.url);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Checkout is temporarily unavailable.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition enabled:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        disabled={!enabled || loading}
        onClick={beginCheckout}
        type="button"
      >
        {!enabled
          ? "Payments are temporarily unavailable"
          : loading
            ? "Opening secure checkout…"
            : `Continue to secure checkout — ${planLabels[plan]}`}
      </button>
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}
