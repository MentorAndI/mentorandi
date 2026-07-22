import { NextResponse } from "next/server";

import { billingErrorResponse, getBillingOrigin } from "@/services/billing/billing-http";
import { BillingService } from "@/services/billing/billing.service";
import type { PurchasablePlan } from "@/services/billing/billing.types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { plan?: unknown };
    const plan = normalizePlan(body.plan);

    if (!plan) {
      return NextResponse.json(
        { error: "Choose the Personal or Premium plan." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await new BillingService().createCheckoutSession(
        plan,
        getBillingOrigin(request),
      ),
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}

function normalizePlan(value: unknown): PurchasablePlan | null {
  if (value === "PERSONAL" || value === "PREMIUM") return value;
  return null;
}
