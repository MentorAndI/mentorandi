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

  return requestedPath;
}
