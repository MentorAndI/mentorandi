import { NextResponse } from "next/server";

import { BillingAccessService } from "@/services/billing/billing-access.service";
import { billingErrorResponse } from "@/services/billing/billing-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await new BillingAccessService().getCurrentPurchaseStatus();

    if (!status.isAuthenticated) {
      return NextResponse.json(
        { hasActivePaidSubscription: false },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { hasActivePaidSubscription: status.hasActivePaidSubscription },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}
