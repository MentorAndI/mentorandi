import { NextResponse } from "next/server";

import { billingErrorResponse, getBillingOrigin } from "@/services/billing/billing-http";
import { BillingService } from "@/services/billing/billing.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    return NextResponse.json(
      await new BillingService().createPortalSession(getBillingOrigin(request)),
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}
