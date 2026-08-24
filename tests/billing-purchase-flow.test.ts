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
import {
  isStripeReady,
  isTopUpReady,
} from "@/services/billing/billing-config";
import { getTopUpPack } from "@/services/billing/topup-catalog";
import { parseTopUpCheckoutInput } from "@/services/billing/topup-input";
import { UserServiceError } from "@/services/user/user.service";

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

test("top-up pack keys map to server-side credits, prices, and display prices", async () => {
  await withStripeTestEnvironment(async () => {
    assert.deepEqual(getTopUpPack("topup_1000"), {
      credits: 1_000,
      displayPrice: 10,
      key: "topup_1000",
      priceId: "price_topup_1000_server",
    });
    assert.deepEqual(getTopUpPack("topup_2500"), {
      credits: 2_500,
      displayPrice: 25,
      key: "topup_2500",
      priceId: "price_topup_2500_server",
    });
    assert.deepEqual(getTopUpPack("topup_5000"), {
      credits: 5_000,
      displayPrice: 50,
      key: "topup_5000",
      priceId: "price_topup_5000_server",
    });
  });
});

test("top-up checkout input rejects arbitrary credits, prices, and packs", () => {
  assert.deepEqual(parseTopUpCheckoutInput({ packKey: "topup_1000" }), {
    packKey: "topup_1000",
  });
  assert.equal(
    parseTopUpCheckoutInput({ credits: 1_000, packKey: "topup_1000" }),
    null,
  );
  assert.equal(
    parseTopUpCheckoutInput({
      packKey: "topup_1000",
      priceId: "price_browser_controlled",
    }),
    null,
  );
  assert.equal(parseTopUpCheckoutInput({ packKey: "topup_999999" }), null);
});

test("unauthenticated and Free Trial users cannot create top-up checkout", async () => {
  await withStripeTestEnvironment(async () => {
    let stripeCalls = 0;
    const stripe = {
      post: async () => {
        stripeCalls += 1;
        return { url: "https://checkout.stripe.test/session" };
      },
    };
    const unauthenticated = new BillingService(
      { findByUserId: async () => null } as never,
      stripe as never,
      {
        resolveAuthenticatedUser: async () => {
          throw new UserServiceError("Unauthorized.", 401);
        },
      } as never,
      {} as never,
      async () => null,
    );

    await assert.rejects(
      unauthenticated.createTopUpCheckoutSession(
        "topup_1000",
        "https://app.mentorandi.com",
      ),
      (error: unknown) =>
        error instanceof UserServiceError && error.statusCode === 401,
    );

    const freeTrial = new BillingService(
      {
        findByUserId: async () => ({
          billingCustomerId: null,
          billingSubscriptionId: null,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
        }),
      } as never,
      stripe as never,
      { resolveAuthenticatedUser: async () => authenticatedUser } as never,
      {} as never,
      async () => null,
    );

    await assert.rejects(
      freeTrial.createTopUpCheckoutSession(
        "topup_1000",
        "https://app.mentorandi.com",
      ),
      (error: unknown) =>
        error instanceof BillingServiceError && error.statusCode === 403,
    );

    const trialingPaidPlan = new BillingService(
      {
        findByUserId: async () => ({
          billingCustomerId: "cus_trialing",
          billingSubscriptionId: "sub_trialing",
          plan: SubscriptionPlan.SINGLE,
          status: SubscriptionStatus.TRIALING,
        }),
      } as never,
      stripe as never,
      { resolveAuthenticatedUser: async () => authenticatedUser } as never,
      {} as never,
      async () => null,
    );

    await assert.rejects(
      trialingPaidPlan.createTopUpCheckoutSession(
        "topup_1000",
        "https://app.mentorandi.com",
      ),
      (error: unknown) =>
        error instanceof BillingServiceError && error.statusCode === 403,
    );
    assert.equal(stripeCalls, 0);
  });
});

test("ACTIVE paid user checkout uses payment mode, existing customer, and server Price ID", async () => {
  await withStripeTestEnvironment(async () => {
    let postedPath = "";
    let postedValues: Record<string, string> = {};
    const service = new BillingService(
      {
        findByUserId: async () => ({
          billingCustomerId: "cus_existing",
          billingSubscriptionId: "sub_existing",
          plan: SubscriptionPlan.SINGLE,
          status: SubscriptionStatus.ACTIVE,
        }),
      } as never,
      {
        post: async (path: string, values: Record<string, string>) => {
          postedPath = path;
          postedValues = values;
          return { url: "https://checkout.stripe.test/topup" };
        },
      } as never,
      { resolveAuthenticatedUser: async () => authenticatedUser } as never,
      {} as never,
      async () => null,
    );

    await service.createTopUpCheckoutSession(
      "topup_2500",
      "https://app.mentorandi.com",
    );

    assert.equal(postedPath, "/checkout/sessions");
    assert.equal(postedValues.mode, "payment");
    assert.equal(postedValues.customer, "cus_existing");
    assert.equal(
      postedValues["line_items[0][price]"],
      "price_topup_2500_server",
    );
    assert.equal(postedValues["line_items[0][quantity]"], "1");
    assert.equal(postedValues["metadata[purchase_type]"], "credit_topup");
    assert.equal(postedValues["metadata[pack_key]"], "topup_2500");
    assert.equal(postedValues["metadata[user_id]"], authenticatedUser.id);
    assert.equal(
      postedValues.success_url,
      "https://app.mentorandi.com/credits?topup=returned",
    );
    assert.equal(
      postedValues.cancel_url,
      "https://app.mentorandi.com/credits?topup=canceled",
    );
    assert.equal("payment_method_types" in postedValues, false);
  });
});

test("paid and async top-up webhooks grant server-resolved credits; unpaid grants zero", async () => {
  await withStripeTestEnvironment(async () => {
    const grants: unknown[] = [];
    const verifiedSignatures: Array<string | null> = [];
    const service = createWebhookService(grants, verifiedSignatures);

    await service.handleWebhook(
      topUpEvent("checkout.session.completed", "paid", "cs_paid", "topup_1000"),
      "signed",
    );
    await service.handleWebhook(
      topUpEvent("checkout.session.completed", "unpaid", "cs_unpaid", "topup_5000"),
      "signed",
    );
    await service.handleWebhook(
      topUpEvent(
        "checkout.session.async_payment_succeeded",
        "paid",
        "cs_async",
        "topup_2500",
      ),
      "signed",
    );

    assert.deepEqual(grants, [
      {
        checkoutSessionId: "cs_paid",
        credits: 1_000,
        userId: authenticatedUser.id,
      },
      {
        checkoutSessionId: "cs_async",
        credits: 2_500,
        userId: authenticatedUser.id,
      },
    ]);
    assert.deepEqual(verifiedSignatures, ["signed", "signed", "signed"]);
  });
});

test("top-up Price IDs remain out of client code and purchase UI is linked", async () => {
  const [creditsClient, mentorClient, settingsPage] = await Promise.all([
    readFile("components/billing/CreditsPageClient.tsx", "utf8"),
    readFile("components/mentor/MentorConversationClient.tsx", "utf8"),
    readFile("app/settings/page.tsx", "utf8"),
  ]);

  assert.doesNotMatch(creditsClient, /STRIPE_PRICE_|price_/);
  assert.match(creditsClient, /JSON\.stringify\(\{ packKey \}\)/);
  assert.match(mentorClient, /href="\/credits"[\s\S]*Buy more credits/);
  assert.match(settingsPage, /href="\/credits"[\s\S]*Buy more credits/);
});

test("missing top-up prices do not break existing subscription readiness", async () => {
  await withStripeTestEnvironment(async () => {
    delete process.env.STRIPE_PRICE_TOPUP_1000;
    delete process.env.STRIPE_PRICE_TOPUP_2500;
    delete process.env.STRIPE_PRICE_TOPUP_5000;

    assert.equal(isStripeReady(), true);
    assert.equal(isTopUpReady(), false);
  });
});

async function withStripeTestEnvironment(run: () => Promise<void>) {
  const values = {
    NEXT_PUBLIC_STRIPE_ENABLED: "true",
    STRIPE_MODE: "test",
    STRIPE_PRICE_PLUS_MONTHLY: "price_plus_server",
    STRIPE_PRICE_PREMIUM_MONTHLY: "price_premium_server",
    STRIPE_PRICE_SINGLE_MONTHLY: "price_single_server",
    STRIPE_PRICE_TOPUP_1000: "price_topup_1000_server",
    STRIPE_PRICE_TOPUP_2500: "price_topup_2500_server",
    STRIPE_PRICE_TOPUP_5000: "price_topup_5000_server",
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

function createWebhookService(
  grants: unknown[],
  verifiedSignatures: Array<string | null>,
) {
  return new BillingService(
    {} as never,
    {
      verifyWebhook: (_rawBody: string, signature: string | null) => {
        verifiedSignatures.push(signature);
      },
    } as never,
    {} as never,
    {
      applyPurchasedTopUp: async (input: unknown) => {
        grants.push(input);
      },
    } as never,
    async () => null,
  );
}

function topUpEvent(
  type: string,
  paymentStatus: string,
  sessionId: string,
  packKey: string,
) {
  return JSON.stringify({
    data: {
      object: {
        id: sessionId,
        metadata: {
          credits: "999999999",
          pack_key: packKey,
          purchase_type: "credit_topup",
          user_id: authenticatedUser.id,
        },
        payment_status: paymentStatus,
      },
    },
    livemode: false,
    type,
  });
}
