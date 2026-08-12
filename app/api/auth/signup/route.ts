import { NextRequest, NextResponse } from "next/server";

import {
  AlphaSignupService,
  AlphaSignupServiceError,
} from "@/services/auth/alpha-signup.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
      nextPath?: unknown;
      password?: unknown;
    } | null;

    const result = await new AlphaSignupService().signup({
      email: readString(body?.email),
      nextPath: readOptionalString(body?.nextPath),
      password: readString(body?.password),
      requestOrigin: request.nextUrl.origin,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AlphaSignupServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("Unexpected signup error", error);
    }

    return NextResponse.json(
      { error: "Unable to create an account right now. Please try again." },
      { status: 500 },
    );
  }
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
