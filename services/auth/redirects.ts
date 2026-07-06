const allowedNextPathPrefixes = ["/start", "/mentor", "/settings"] as const;
const defaultAuthCallbackNextPath = "/start";

export function getSafeAuthRedirectPath(
  requestedPath: string | null,
  fallbackPath = "/",
) {
  if (!requestedPath || !requestedPath.startsWith("/")) {
    return fallbackPath;
  }

  if (requestedPath.startsWith("//")) {
    return fallbackPath;
  }

  const pathOnly = requestedPath.split(/[?#]/)[0] ?? requestedPath;

  if (
    pathOnly === "/login" ||
    pathOnly === "/signup" ||
    pathOnly === "/forgot-password" ||
    pathOnly.startsWith("/api/")
  ) {
    return fallbackPath;
  }

  return requestedPath;
}

export function buildAuthCallbackUrl(
  origin: string,
  nextPath = defaultAuthCallbackNextPath,
) {
  const callbackUrl = new URL("/auth/callback", origin);

  callbackUrl.searchParams.set("next", normalizeSafeAuthNextPath(nextPath));

  return callbackUrl.toString();
}

export function normalizeSafeAuthNextPath(nextPath: string | null | undefined) {
  if (!nextPath) {
    return defaultAuthCallbackNextPath;
  }

  try {
    const parsedUrl = new URL(nextPath, "https://mentorandi.local");

    if (parsedUrl.origin !== "https://mentorandi.local") {
      return defaultAuthCallbackNextPath;
    }

    const normalizedPath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

    return isAllowedAuthNextPath(parsedUrl.pathname)
      ? normalizedPath
      : defaultAuthCallbackNextPath;
  } catch {
    return defaultAuthCallbackNextPath;
  }
}

function isAllowedAuthNextPath(pathname: string) {
  return allowedNextPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
