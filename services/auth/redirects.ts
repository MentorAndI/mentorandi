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
