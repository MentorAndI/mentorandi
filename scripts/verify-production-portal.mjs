import pg from "pg";

const { Pool } = pg;
const stripeApiBase = "https://api.stripe.com/v1";
const stripeApiVersion = "2026-02-25.clover";
const productionOrigin = "https://app.mentorandi.com";
const returnUrl = `${productionOrigin}/settings`;

const databaseUrl = requireEnvironmentValue("DATABASE_URL");
const stripeSecretKey = requireEnvironmentValue("STRIPE_SECRET_KEY");

assertProductionConfiguration(stripeSecretKey);

const pool = new Pool({ connectionString: databaseUrl, max: 1 });

try {
  const beforeDatabase = await readSingleSubscriptionSnapshot(pool);
  const beforeStripe = await retrieveStripeSubscription(
    beforeDatabase.billing_subscription_id,
    stripeSecretKey,
  );

  assert(beforeStripe.status === "active", "The live SINGLE subscription is not active.");

  const portal = await createPortalSession(
    beforeDatabase.billing_customer_id,
    stripeSecretKey,
  );

  assert(portal.object === "billing_portal.session", "Stripe returned an unexpected object.");
  assert(portal.livemode === true, "Stripe returned a non-live portal session.");
  assert(
    portal.customer === beforeDatabase.billing_customer_id,
    "Stripe returned a portal session for a different customer.",
  );
  assert(portal.return_url === returnUrl, "Stripe returned an unexpected return URL.");
  assertStripeHostedUrl(portal.url);

  const [afterDatabase, afterStripe] = await Promise.all([
    readSingleSubscriptionSnapshot(pool),
    retrieveStripeSubscription(
      beforeDatabase.billing_subscription_id,
      stripeSecretKey,
    ),
  ]);

  assert(
    JSON.stringify(afterDatabase) === JSON.stringify(beforeDatabase),
    "Subscription or credit data changed during portal verification.",
  );
  assert(
    JSON.stringify(subscriptionCancellationSnapshot(afterStripe)) ===
      JSON.stringify(subscriptionCancellationSnapshot(beforeStripe)),
    "The Stripe subscription cancellation state changed during portal verification.",
  );
  assert(afterStripe.status === "active", "The live SINGLE subscription is no longer active.");

  console.log("PORTAL SESSION CREATION: PASS");
  console.log("RETURN TO SETTINGS: PASS");
  console.log("SUBSCRIPTION REMAINED ACTIVE: PASS");
  console.log("CREDIT BALANCE UNCHANGED: PASS");
} finally {
  await pool.end();
}

async function readSingleSubscriptionSnapshot(databasePool) {
  const result = await databasePool.query(`
    SELECT
      subscription."userId" AS user_id,
      subscription.plan::text AS plan,
      subscription.status::text AS status,
      subscription."billingCustomerId" AS billing_customer_id,
      subscription."billingSubscriptionId" AS billing_subscription_id,
      subscription."cancelAtPeriodEnd" AS cancel_at_period_end,
      subscription."currentPeriodEnd"::text AS current_period_end,
      credit."planBalance"::text AS plan_balance,
      credit."topUpBalance"::text AS top_up_balance,
      credit."periodKey" AS credit_period_key,
      credit."lifetimeGranted"::text AS lifetime_granted,
      credit."lifetimeUsed"::text AS lifetime_used,
      (
        SELECT COUNT(*)::text
        FROM "CreditTransaction" credit_transaction
        WHERE credit_transaction."userId" = subscription."userId"
      ) AS credit_transaction_count
    FROM "Subscription" subscription
    LEFT JOIN "CreditAccount" credit
      ON credit."userId" = subscription."userId"
    WHERE subscription.plan = 'SINGLE'
      AND subscription.status = 'ACTIVE'
      AND subscription."billingCustomerId" IS NOT NULL
      AND subscription."billingSubscriptionId" IS NOT NULL
  `);

  assert(
    result.rows.length === 1,
    "Expected exactly one active live SINGLE subscription with a billing customer.",
  );

  return result.rows[0];
}

async function createPortalSession(customerId, secretKey) {
  const response = await fetch(`${stripeApiBase}/billing_portal/sessions`, {
    body: new URLSearchParams({ customer: customerId, return_url: returnUrl }),
    headers: stripeHeaders(secretKey),
    method: "POST",
  });

  assert(response.ok, "Stripe could not create the live Customer Portal session.");
  return response.json();
}

async function retrieveStripeSubscription(subscriptionId, secretKey) {
  const response = await fetch(
    `${stripeApiBase}/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { headers: stripeHeaders(secretKey) },
  );

  assert(response.ok, "Stripe could not retrieve the live SINGLE subscription.");
  return response.json();
}

function stripeHeaders(secretKey) {
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Stripe-Version": stripeApiVersion,
  };
}

function subscriptionCancellationSnapshot(subscription) {
  return {
    cancel_at: subscription.cancel_at ?? null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ?? null,
    cancellation_details: subscription.cancellation_details ?? null,
    status: subscription.status,
  };
}

function assertStripeHostedUrl(value) {
  assert(typeof value === "string" && value.length > 0, "Stripe returned no portal URL.");
  const url = new URL(value);
  assert(
    url.protocol === "https:" && url.hostname === "billing.stripe.com",
    "Stripe returned a portal URL on an unexpected host.",
  );
}

function assertProductionConfiguration(secretKey) {
  assert(process.env.NODE_ENV === "production", "Production verification requires NODE_ENV=production.");
  assert(process.env.APP_URL === productionOrigin, "Production APP_URL is not configured correctly.");
  assert(process.env.STRIPE_MODE === "live", "Production Stripe mode is not live.");
  assert(
    process.env.NEXT_PUBLIC_STRIPE_ENABLED?.trim().toLowerCase() === "true",
    "Production Stripe billing is not enabled.",
  );
  assert(
    secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_"),
    "Production Stripe credentials are not live credentials.",
  );
}

function requireEnvironmentValue(name) {
  const value = process.env[name]?.trim();
  assert(value, `Missing required production setting: ${name}.`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
