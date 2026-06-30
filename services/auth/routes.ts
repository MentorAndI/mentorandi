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
