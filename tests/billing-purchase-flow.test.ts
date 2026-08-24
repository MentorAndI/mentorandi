import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/generated/prisma/client";
import {
  BillingService,
  BillingServiceError,
} from "@/services/billing/billing.service";

const authenticatedUser = {
  authUserId: "00000000-0000-0000-0000-000000000002",
  createdAt: new Date(0).toISOString(),
  id: "00000000-0000-0000-0000-000000000003",
  updatedAt: new Date(0).toISOString(),
};

test("an active paid subscriber cannot start a duplicate checkout", async () => {
  await withStripeTestEnvironment(async () => {
    let stripeCalls = 0;
    const repository = {
      findByUserId: async () => ({
        billingSubscriptionId: "sub_existing",
        plan: SubscriptionPlan.SINGLE,
        status: SubscriptionStatus.ACTIVE,
      }),
    };
    const stripe = {
      post: async () => {
        stripeCalls += 1;
        return { url: "https://checkout.stripe.test/session" };
      },
    };
    const service = new BillingService(
      repository as never,
      stripe as never,
      { resolveAuthenticatedUser: async () => authenticatedUser } as never,
      {} as never,
      async () => "member@example.test",
    );

    await assert.rejects(
      service.createCheckoutSession("SINGLE", "https://app.mentorandi.com"),
      (error: unknown) =>
        error instanceof BillingServiceError && error.statusCode === 409,
    );
    assert.equal(stripeCalls, 0);
  });
});

test("checkout receives a server-configured Price ID and returns for verified activation", async () => {
  await withStripeTestEnvironment(async () => {
    let postedValues: Record<string, string> = {};
    const repository = {
      findByUserId: async () => null,
    };
    const stripe = {
      post: async (_path: string, values: Record<string, string>) => {
        postedValues = values;
        return { url: "https://checkout.stripe.test/session" };
      },
    };
    const service = new BillingService(
      repository as never,
      stripe as never,
      { resolveAuthenticatedUser: async () => authenticatedUser } as never,
      {} as never,
      async () => "member@example.test",
    );

    const result = await service.createCheckoutSession(
      "PLUS",
      "https://app.mentorandi.com",
    );

    assert.equal(result.url, "https://checkout.stripe.test/session");
    assert.equal(postedValues["line_items[0][price]"], "price_plus_server");
    assert.equal(
      postedValues.success_url,
      "https://app.mentorandi.com/onboarding?plan=plus&checkout=returned",
    );
  });
});

test("production plan credit allocations remain unchanged", async () => {
  const source = await readFile("services/credits/credit.service.ts", "utf8");

  assert.match(source, /SINGLE:\s*800/);
  assert.match(source, /PLUS:\s*2000/);
  assert.match(source, /PREMIUM:\s*5000/);
});

async function withStripeTestEnvironment(run: () => Promise<void>) {
  const values = {
    NEXT_PUBLIC_STRIPE_ENABLED: "true",
    STRIPE_MODE: "test",
    STRIPE_PRICE_PLUS_MONTHLY: "price_plus_server",
    STRIPE_PRICE_PREMIUM_MONTHLY: "price_premium_server",
    STRIPE_PRICE_SINGLE_MONTHLY: "price_single_server",
    STRIPE_SECRET_KEY: "rk_test_unit_only",
    STRIPE_WEBHOOK_SECRET: "whsec_unit_only",
  } as const;
  const previous = new Map<string, string | undefined>();

  for (const [name, value] of Object.entries(values)) {
    previous.set(name, process.env[name]);
    process.env[name] = value;
  }

  try {
    await run();
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}
