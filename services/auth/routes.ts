export const AUTH_PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/mentor",
  "/onboarding",
  "/settings",
] as const;

export function isProtectedAuthRoute(pathname: string) {
  return AUTH_PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isDevelopmentProtectedRouteBypass(pathname: string) {
  return (
    process.env.NODE_ENV !== "production" &&
    (pathname === "/mentor" ||
      pathname.startsWith("/mentor/") ||
      pathname === "/settings" ||
      pathname.startsWith("/settings/"))
  );
}
