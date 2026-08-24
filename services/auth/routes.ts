export const AUTH_PROTECTED_ROUTE_PREFIXES = [
  "/admin",
  "/credits",
  "/dashboard",
  "/feedback",
  "/mentor",
  "/onboarding",
  "/settings",
] as const;

export const PRODUCTION_HIDDEN_LEGACY_ROUTES = [
  "/alpha",
  "/demo",
  "/match",
  "/reflection",
  "/welcome",
] as const;

export function isProtectedAuthRoute(pathname: string) {
  return AUTH_PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isProductionHiddenLegacyRoute(pathname: string) {
  return PRODUCTION_HIDDEN_LEGACY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
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
