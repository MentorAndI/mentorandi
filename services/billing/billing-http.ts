import { NextResponse } from "next/server";

import { BillingConfigurationError } from "@/services/billing/billing-config";
import { BillingServiceError } from "@/services/billing/billing.service";
import {
  StripeRequestError,
  StripeSignatureError,
} from "@/services/billing/stripe-client";
import { UserServiceError } from "@/services/user/user.service";

export function getBillingOrigin(request: Request) {
  const configured = process.env.APP_URL?.trim();
  return (configured ? new URL(configured) : new URL(request.url)).origin;
}

export function billingErrorResponse(error: unknown) {
  if (
    error instanceof BillingConfigurationError ||
    error instanceof BillingServiceError ||
    error instanceof StripeRequestError ||
    error instanceof StripeSignatureError ||
    error instanceof UserServiceError
  ) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  console.error("Unexpected billing request failure.");
  return NextResponse.json(
    { error: "Billing is temporarily unavailable. No charge was created." },
    { status: 500 },
  );
}
