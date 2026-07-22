const stripeApiBase = "https://api.stripe.com/v1";
const stripeApiVersion = "2026-02-25.clover";
const webhookUrl = "https://staging.mentorandi.com/api/billing/webhook";
const managedBy = "setup-stripe-staging";
const requiredWebhookEvents = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
];

const plans = [
  {
    amount: readAmount("STRIPE_TEST_PERSONAL_MONTHLY_AMOUNT", 1000),
    envName: "STRIPE_PRICE_PERSONAL_MONTHLY",
    name: "Mentor And I Personal",
    plan: "personal",
  },
  {
    amount: readAmount("STRIPE_TEST_PREMIUM_MONTHLY_AMOUNT", 2000),
    envName: "STRIPE_PRICE_PREMIUM_MONTHLY",
    name: "Mentor And I Premium",
    plan: "premium",
  },
];
const currency = readCurrency();
const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

if (!secretKey) {
  fail(
    "Missing STRIPE_SECRET_KEY. Export a Stripe test secret key for this command only.",
  );
}

if (!secretKey.startsWith("sk_test_")) {
  fail("Refusing to run: STRIPE_SECRET_KEY must begin with sk_test_.");
}

console.log(
  `Stripe test-mode staging setup (${previewSecret(secretKey)}; ${currency.toUpperCase()}).`,
);
console.log(
  "Test amounts are setup values only and are not approved live pricing.",
);

const priceIds = {};

for (const plan of plans) {
  const product = await findOrCreateProduct(plan);
  const price = await findOrCreatePrice(product.id, plan);
  priceIds[plan.envName] = price.id;
}

const webhook = await findOrCreateWebhook();

console.log("\nCopy these lines into /docker/mentorandi/.env.staging:");
console.log(
  "STRIPE_SECRET_KEY=<paste the same sk_test_ value; intentionally not printed>",
);
console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
console.log(
  `STRIPE_PRICE_PERSONAL_MONTHLY=${priceIds.STRIPE_PRICE_PERSONAL_MONTHLY}`,
);
console.log(
  `STRIPE_PRICE_PREMIUM_MONTHLY=${priceIds.STRIPE_PRICE_PREMIUM_MONTHLY}`,
);
console.log("NEXT_PUBLIC_STRIPE_ENABLED=true");
console.log("\nThen redeploy staging so the public UI flag is rebuilt.");

async function findOrCreateProduct(plan) {
  const products = await listAll("/products", { active: "true" });
  const product =
    products.find(
      (item) =>
        item.metadata?.mentorandi_environment === "staging" &&
        item.metadata?.mentorandi_plan === plan.plan,
    ) ?? products.find((item) => item.name === plan.name);

  if (product) {
    assertTestResource(product, `product ${product.id}`);

    if (
      product.metadata?.mentorandi_environment !== "staging" ||
      product.metadata?.mentorandi_plan !== plan.plan
    ) {
      await stripeRequest(`/products/${encodeURIComponent(product.id)}`, {
        body: managedMetadata(plan.plan),
        method: "POST",
      });
    }

    console.log(`Reusing ${plan.name} product (${product.id}).`);
    return product;
  }

  const created = await stripeRequest("/products", {
    body: {
      name: plan.name,
      ...managedMetadata(plan.plan),
    },
    idempotencyKey: `mentorandi-staging-product-${plan.plan}`,
    method: "POST",
  });
  assertTestResource(created, `product ${created.id}`);
  console.log(`Created ${plan.name} product (${created.id}).`);
  return created;
}

async function findOrCreatePrice(productId, plan) {
  const prices = await listAll("/prices", {
    active: "true",
    product: productId,
    type: "recurring",
  });
  const price = prices.find(
    (item) =>
      item.currency === currency &&
      item.unit_amount === plan.amount &&
      item.recurring?.interval === "month" &&
      item.recurring?.interval_count === 1,
  );

  if (price) {
    assertTestResource(price, `price ${price.id}`);
    console.log(
      `Reusing ${plan.name} monthly test price (${price.id}, ${formatAmount(plan.amount)}).`,
    );
    return price;
  }

  const created = await stripeRequest("/prices", {
    body: {
      currency,
      nickname: `${plan.name} staging test monthly`,
      product: productId,
      "recurring[interval]": "month",
      "recurring[interval_count]": "1",
      unit_amount: String(plan.amount),
      ...managedMetadata(plan.plan),
    },
    idempotencyKey: `mentorandi-staging-price-${plan.plan}-${currency}-${plan.amount}`,
    method: "POST",
  });
  assertTestResource(created, `price ${created.id}`);
  console.log(
    `Created ${plan.name} monthly test price (${created.id}, ${formatAmount(plan.amount)}).`,
  );
  return created;
}

async function findOrCreateWebhook() {
  const endpoints = await listAll("/webhook_endpoints");
  const endpoint = endpoints.find((item) => item.url === webhookUrl);

  if (endpoint) {
    assertTestResource(endpoint, `webhook endpoint ${endpoint.id}`);

    if (endpoint.api_version !== stripeApiVersion) {
      fail(
        `Existing webhook ${endpoint.id} uses API version ${endpoint.api_version ?? "account default"}. Recreate it with ${stripeApiVersion} before rerunning.`,
      );
    }

    const existingSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

    if (!existingSecret?.startsWith("whsec_")) {
      fail(
        `Webhook ${endpoint.id} already exists. Its signing secret cannot be recovered from Stripe. Rerun with STRIPE_WEBHOOK_SECRET=whsec_... or recreate that endpoint in Stripe test mode.`,
      );
    }

    const existingEvents = endpoint.enabled_events ?? [];
    const enabledEvents = existingEvents.includes("*")
      ? ["*"]
      : unique([...existingEvents, ...requiredWebhookEvents]);
    await stripeRequest(
      `/webhook_endpoints/${encodeURIComponent(endpoint.id)}`,
      {
        body: {
          description: "Mentor And I staging test subscriptions",
          ...arrayValues("enabled_events[]", enabledEvents),
          status: "enabled",
        },
        method: "POST",
      },
    );
    console.log(`Reusing staging webhook endpoint (${endpoint.id}).`);
    return { secret: existingSecret };
  }

  const created = await stripeRequest("/webhook_endpoints", {
    body: {
      api_version: stripeApiVersion,
      description: "Mentor And I staging test subscriptions",
      ...arrayValues("enabled_events[]", requiredWebhookEvents),
      url: webhookUrl,
    },
    idempotencyKey: "mentorandi-staging-webhook-v1",
    method: "POST",
  });
  assertTestResource(created, `webhook endpoint ${created.id}`);

  if (!created.secret?.startsWith("whsec_")) {
    fail("Stripe created the webhook but did not return its signing secret.");
  }

  console.log(`Created staging webhook endpoint (${created.id}).`);
  return { secret: created.secret };
}

async function listAll(path, query = {}) {
  const items = [];
  let startingAfter;

  do {
    const page = await stripeRequest(path, {
      query: {
        ...query,
        limit: "100",
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      },
    });
    const data = Array.isArray(page.data) ? page.data : [];
    items.push(...data);
    startingAfter = page.has_more && data.length > 0 ? data.at(-1).id : null;
  } while (startingAfter);

  return items;
}

async function stripeRequest(
  path,
  { body, idempotencyKey, method = "GET", query } = {},
) {
  const url = new URL(`${stripeApiBase}${path}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value);
  }

  const headers = {
    Authorization: `Bearer ${secretKey}`,
    "Stripe-Version": stripeApiVersion,
    ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
  };
  const response = await fetch(url, {
    ...(body ? { body: toFormBody(body) } : {}),
    headers,
    method,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    const code = safeStripeValue(payload?.error?.code);
    const type = safeStripeValue(payload?.error?.type);
    fail(
      `Stripe request failed (${response.status}${type ? `, ${type}` : ""}${code ? `, ${code}` : ""}). No secret was logged.`,
    );
  }

  return payload;
}

function toFormBody(values) {
  const body = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) body.append(key, item);
    } else {
      body.append(key, value);
    }
  }

  return body;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    fail(`Stripe returned a non-JSON response (${response.status}).`);
  }
}

function managedMetadata(plan) {
  return {
    "metadata[mentorandi_environment]": "staging",
    "metadata[mentorandi_managed_by]": managedBy,
    "metadata[mentorandi_plan]": plan,
  };
}

function arrayValues(key, values) {
  return { [key]: values };
}

function assertTestResource(resource, label) {
  if (resource?.livemode !== false) {
    fail(`Refusing to use ${label}: Stripe did not identify it as test mode.`);
  }
}

function readAmount(name, fallback) {
  const raw = process.env[name]?.trim();
  const value = raw ? Number(raw) : fallback;

  if (!Number.isSafeInteger(value) || value < 0) {
    fail(`${name} must be a non-negative integer in the currency's minor unit.`);
  }

  return value;
}

function readCurrency() {
  const value = (process.env.STRIPE_TEST_CURRENCY ?? "usd").trim().toLowerCase();

  if (!/^[a-z]{3}$/.test(value)) {
    fail("STRIPE_TEST_CURRENCY must be a three-letter lowercase currency code.");
  }

  return value;
}

function formatAmount(amount) {
  return `${currency.toUpperCase()} ${(amount / 100).toFixed(2)} test-only`;
}

function previewSecret(value) {
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function safeStripeValue(value) {
  return typeof value === "string" && /^[a-z0-9_-]{1,80}$/i.test(value)
    ? value
    : null;
}

function unique(values) {
  return [...new Set(values)].sort();
}

function fail(message) {
  console.error(`Stripe staging setup failed: ${message}`);
  process.exit(1);
}
