import { NextResponse } from "next/server";

import { AdminAuthService } from "@/services/admin/admin-auth.service";
import {
  BufferService,
  BufferServiceError,
} from "@/services/social/buffer.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const accessResponse = await requireAdmin();

  if (accessResponse) {
    return accessResponse;
  }

  const buffer = new BufferService();

  if (!buffer.isConfigured()) {
    return NextResponse.json({
      configured: false,
      channels: [],
      organizations: [],
    });
  }

  try {
    const organizations = await buffer.getOrganizations();
    const channelGroups = await Promise.all(
      organizations.map(async (organization) => ({
        organization,
        channels: await buffer.getChannels(organization.id),
      })),
    );

    return NextResponse.json({
      configured: true,
      organizations: channelGroups,
    });
  } catch (error) {
    return handleBufferError(error, "Unable to read Buffer configuration.");
  }
}

export async function POST(request: Request) {
  const accessResponse = await requireAdmin();

  if (accessResponse) {
    return accessResponse;
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      channelId?: unknown;
      dueAt?: unknown;
      mode?: unknown;
      text?: unknown;
    } | null;

    const text = readString(body?.text);

    if (!text) {
      return NextResponse.json(
        { error: "Post text is required." },
        { status: 400 },
      );
    }

    const mode = readMode(body?.mode);
    const post = await new BufferService().createPost({
      channelId: readString(body?.channelId),
      dueAt: readString(body?.dueAt),
      mode,
      text,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return handleBufferError(error, "Unable to create the Buffer post.");
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

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function readMode(value: unknown) {
  return value === "addToQueue" ||
    value === "customScheduled" ||
    value === "shareNow"
    ? value
    : undefined;
}

function handleBufferError(error: unknown, fallbackMessage: string) {
  if (error instanceof BufferServiceError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
