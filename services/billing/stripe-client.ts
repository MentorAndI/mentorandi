import { createHmac, timingSafeEqual } from "node:crypto";

import {
  getStripeSecretKey,
  getStripeWebhookSecret,
} from "@/services/billing/billing-config";

const stripeApiBase = "https://api.stripe.com/v1";
export const stripeApiVersion = "2026-02-25.clover";
const signatureToleranceSeconds = 300;

export class StripeClient {
  async post(path: string, values: Record<string, string>) {
    const response = await fetch(`${stripeApiBase}${path}`, {
      body: new URLSearchParams(values),
      headers: {
        Authorization: `Bearer ${getStripeSecretKey()}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": stripeApiVersion,
      },
      method: "POST",
    });
    const body = (await response.json()) as {
      error?: { message?: string };
      id?: string;
      url?: string;
    };

    if (!response.ok) {
      throw new StripeRequestError();
    }

    return body;
  }

  verifyWebhook(rawBody: string, signatureHeader: string | null) {
    if (!signatureHeader) {
      throw new StripeSignatureError();
    }

    const parts = signatureHeader.split(",");
    const timestamp = parts
      .find((part) => part.startsWith("t="))
      ?.slice(2);
    const signatures = parts
      .filter((part) => part.startsWith("v1="))
      .map((part) => part.slice(3));
    const timestampNumber = Number(timestamp);

    if (
      !timestamp ||
      !Number.isFinite(timestampNumber) ||
      Math.abs(Date.now() / 1000 - timestampNumber) > signatureToleranceSeconds
    ) {
      throw new StripeSignatureError();
    }

    const expected = createHmac("sha256", getStripeWebhookSecret())
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    const valid = signatures.some((signature) => safeEqual(signature, expected));

    if (!valid) {
      throw new StripeSignatureError();
    }
  }
}

export class StripeRequestError extends Error {
  readonly statusCode = 502;
  constructor() {
    super("The billing provider could not complete this request. No charge was created.");
    this.name = "StripeRequestError";
  }
}

export class StripeSignatureError extends Error {
  readonly statusCode = 400;
  constructor() {
    super("Invalid Stripe webhook signature.");
    this.name = "StripeSignatureError";
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
