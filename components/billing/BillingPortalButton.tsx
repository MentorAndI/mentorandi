"use client";

import { useState } from "react";

export function BillingPortalButton({ enabled }: { enabled: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const body = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !body.url) throw new Error(body.error ?? "Billing portal unavailable.");
      window.location.assign(body.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Billing portal unavailable.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-950">Plan and billing</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        {enabled
          ? "Manage your subscription, payment method and invoices securely through Stripe."
          : "Billing management is not available right now."}
      </p>
      {enabled ? (
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          If you cancel, your subscription remains active until the end of the
          current billing period.
        </p>
      ) : null}
      <button
        className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 enabled:hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
        disabled={!enabled || loading}
        onClick={openPortal}
        type="button"
      >
        {loading
          ? "Opening…"
          : enabled
            ? "Manage subscription"
            : "Billing unavailable"}
      </button>
      {message ? <p className="mt-3 text-sm text-amber-800" role="status">{message}</p> : null}
    </div>
  );
}
