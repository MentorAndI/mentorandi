import { NextResponse } from "next/server";

import {
  AlphaInviteService,
  AlphaInviteServiceError,
} from "@/services/alpha-invite/alpha-invite.service";
import { AdminAuthService } from "@/services/admin/admin-auth.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const accessResponse = await requireAdmin();

  if (accessResponse) {
    return accessResponse;
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
      expiresAt?: unknown;
      maxUses?: unknown;
      note?: unknown;
    } | null;
    const result = await new AlphaInviteService().createInvite({
      email: readOptionalString(body?.email),
      expiresAt: readOptionalString(body?.expiresAt),
      maxUses: readOptionalNumber(body?.maxUses),
      note: readOptionalString(body?.note),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AlphaInviteServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to create an invite right now." },
      { status: 500 },
    );
  }
}

async function requireAdmin() {
  const access = await new AdminAuthService().resolveAdminAccess();

  if (access.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (access.status === "forbidden") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readOptionalNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}
