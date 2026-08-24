const allowedNextPathPrefixes = [
  "/start",
  "/onboarding",
  "/feedback",
  "/mentor",
  "/mentors",
  "/settings",
] as const;
const defaultAuthCallbackNextPath = "/onboarding";
const internalHostnames = new Set([
  "0.0.0.0",
  "::",
  "::1",
  "127.0.0.1",
  "host.docker.internal",
  "localhost",
  "mentorandi-staging",
]);

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

export function buildAuthCallbackUrl(origin: string, nextPath?: string) {
  const callbackUrl = new URL("/auth/callback", origin);

  if (nextPath) {
    callbackUrl.searchParams.set("next", normalizeSafeAuthNextPath(nextPath));
  }

  return callbackUrl.toString();
}

export function buildLoginPath(nextPath: string) {
  return buildAuthEntryPath("/login", nextPath);
}

export function buildSignupPath(nextPath: string) {
  return buildAuthEntryPath("/signup", nextPath);
}

export function getPublicAppOrigin(requestOrigin: string) {
  const configuredOrigin = getConfiguredPublicAppOrigin();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const requestUrl = new URL(requestOrigin);

  if (isInternalHostname(requestUrl.hostname)) {
    return "http://localhost:3000";
  }

  return requestUrl.origin;
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

function buildAuthEntryPath(route: "/login" | "/signup", nextPath: string) {
  const searchParams = new URLSearchParams({
    next: normalizeSafeAuthNextPath(nextPath),
  });

  return `${route}?${searchParams.toString()}`;
}

function getConfiguredPublicAppOrigin() {
  const configuredUrl =
    process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return null;
  }
}

function isInternalHostname(hostname: string) {
  return internalHostnames.has(hostname.toLowerCase());
}
