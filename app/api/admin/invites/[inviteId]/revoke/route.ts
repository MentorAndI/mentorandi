import { NextResponse } from "next/server";

import {
  AlphaInviteService,
  AlphaInviteServiceError,
} from "@/services/alpha-invite/alpha-invite.service";
import { AdminAuthService } from "@/services/admin/admin-auth.service";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const access = await new AdminAuthService().resolveAdminAccess();

  if (access.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (access.status === "forbidden") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { inviteId } = await params;
    await new AlphaInviteService().revokeInvite(inviteId);
    return NextResponse.json({ revoked: true });
  } catch (error) {
    if (error instanceof AlphaInviteServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to revoke the invite right now." },
      { status: 500 },
    );
  }
}
