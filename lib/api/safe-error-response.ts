import { NextResponse } from "next/server";

interface SafeErrorResponseOptions {
  context: string;
  error: unknown;
  fallbackMessage: string;
  statusCode?: number;
}

export function createSafeErrorResponse({
  context,
  error,
  fallbackMessage,
  statusCode = 500,
}: SafeErrorResponseOptions) {
  const safeStatusCode = normalizeStatusCode(statusCode);

  logServerError(context, error, safeStatusCode);

  return NextResponse.json(
    {
      error: getSafeErrorMessage(safeStatusCode, fallbackMessage),
    },
    { status: safeStatusCode },
  );
}

function normalizeStatusCode(statusCode: number) {
  if ([400, 401, 403, 404].includes(statusCode)) {
    return statusCode;
  }

  return 500;
}

function getSafeErrorMessage(statusCode: number, fallbackMessage: string) {
  if (statusCode === 400) {
    return "Invalid request.";
  }

  if (statusCode === 401) {
    return "Unauthorized.";
  }

  if (statusCode === 403) {
    return "Forbidden.";
  }

  if (statusCode === 404) {
    return "Not found.";
  }

  return fallbackMessage;
}

function logServerError(
  context: string,
  error: unknown,
  statusCode: number,
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error(`[${context}] API error`, {
    error,
    statusCode,
  });
}
