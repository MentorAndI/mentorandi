import { NextResponse } from "next/server";

import {
  billingErrorResponse,
  getBillingOrigin,
} from "@/services/billing/billing-http";
import { BillingService } from "@/services/billing/billing.service";
import { parseTopUpCheckoutInput } from "@/services/billing/topup-input";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const input = parseTopUpCheckoutInput(body);

    if (!input) {
      return NextResponse.json(
        { error: "Choose a valid Mentor Credit pack." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await new BillingService().createTopUpCheckoutSession(
        input.packKey,
        getBillingOrigin(request),
      ),
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}
