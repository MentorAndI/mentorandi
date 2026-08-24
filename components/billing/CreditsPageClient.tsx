"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TopUpPackDisplay } from "@/services/billing/topup.types";

interface CreditBalance {
  balance: number;
  planBalance: number;
  topUpBalance: number;
}

interface CreditsPageClientProps {
  canPurchaseTopUps: boolean;
  initialBalance: CreditBalance;
  packs: TopUpPackDisplay[];
  returnState?: "canceled" | "returned";
  topUpsReady: boolean;
}

export function CreditsPageClient({
  canPurchaseTopUps,
  initialBalance,
  packs,
  returnState,
  topUpsReady,
}: CreditsPageClientProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [activationComplete, setActivationComplete] = useState(false);

  useEffect(() => {
    if (returnState !== "returned") return;

    let canceled = false;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function refreshBalance() {
      attempts += 1;

      try {
        const response = await fetch("/api/credits", { cache: "no-store" });
        if (response.ok) {
          const nextBalance = (await response.json()) as CreditBalance;

          if (!canceled) {
            setBalance(nextBalance);
            if (nextBalance.topUpBalance > initialBalance.topUpBalance) {
              setActivationComplete(true);
              return;
            }
          }
        }
      } catch {
        // Webhook processing and status reads can race. Retry briefly without
        // treating the return query as proof that credits were granted.
      }

      if (!canceled && attempts < 20) {
        timeoutId = setTimeout(refreshBalance, 2_000);
      }
    }

    void refreshBalance();

    return () => {
      canceled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initialBalance.topUpBalance, returnState]);

  return (
    <>
      {returnState === "returned" ? (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950" role="status">
          {activationComplete
            ? "Your purchased credits have been added."
            : "Payment received. Your credits are being added."}
        </div>
      ) : null}
      {returnState === "canceled" ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">
          Purchase canceled. No credits were added.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <BalanceCard label="Current total balance" value={balance.balance} />
        <BalanceCard label="Plan credits" value={balance.planBalance} />
        <BalanceCard label="Top-up credits" value={balance.topUpBalance} />
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-zinc-950">
          Buy Mentor Credits
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          Top-up credits do not expire and remain in your account until used.
          They are service usage credits and are not withdrawable or
          transferable.
        </p>

        {!canPurchaseTopUps ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
            <p>
              Top-ups are available with an active Mentor And I subscription.
            </p>
            <Button className="mt-4" href="/pricing" size="sm">
              View plans
            </Button>
          </div>
        ) : !topUpsReady ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
            Mentor Credit top-ups are temporarily unavailable. Your existing
            subscription and credits are unchanged.
          </div>
        ) : null}

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {packs.map((pack) => (
            <Card className="flex flex-col p-6" key={pack.key} variant="bordered">
              <h3 className="text-lg font-semibold text-zinc-950">
                {formatCredits(pack.credits)} Mentor Credits
              </h3>
              <p className="mt-3 text-3xl font-semibold text-zinc-950">
                ${pack.displayPrice}
              </p>
              <div className="mt-6">
                {canPurchaseTopUps && topUpsReady ? (
                  <TopUpCheckoutButton packKey={pack.key} />
                ) : (
                  <p className="text-sm font-medium text-zinc-500">
                    Active subscription required
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

function BalanceCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5" variant="bordered">
      <p className="text-sm font-medium text-zinc-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950">
        {formatCredits(value)}
      </p>
    </Card>
  );
}

function TopUpCheckoutButton({ packKey }: { packKey: TopUpPackDisplay["key"] }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function beginCheckout() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/billing/topup/checkout", {
        body: JSON.stringify({ packKey }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !body.url) {
        throw new Error(body.error ?? "Top-up checkout is temporarily unavailable.");
      }

      window.location.assign(body.url);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Top-up checkout is temporarily unavailable.",
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        className="w-full rounded-lg bg-sky-950 px-4 py-3 text-sm font-semibold text-white transition enabled:hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-zinc-300"
        disabled={loading}
        onClick={beginCheckout}
        type="button"
      >
        {loading ? "Opening secure checkout…" : "Buy credits"}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function formatCredits(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}
