import { NextResponse } from "next/server";

import { billingErrorResponse } from "@/services/billing/billing-http";
import { BillingService } from "@/services/billing/billing.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    await new BillingService().handleWebhook(
      rawBody,
      request.headers.get("stripe-signature"),
    );
    return NextResponse.json({ received: true });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
