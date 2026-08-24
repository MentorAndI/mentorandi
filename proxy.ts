import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import {
  isDevelopmentProtectedRouteBypass,
  isProductionHiddenLegacyRoute,
  isProtectedAuthRoute,
} from "@/services/auth/routes";

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.hostname.toLowerCase() === "app.mentorandi.com" &&
    isProductionHiddenLegacyRoute(request.nextUrl.pathname)
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({
    request,
  });

  const { anonKey, url } = getSupabasePublicConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Local-only bypass so seeded mentor/account flows can be tested before auth is wired in.
  const shouldRequireAuth =
    isProtectedAuthRoute(request.nextUrl.pathname) &&
    !isDevelopmentProtectedRouteBypass(request.nextUrl.pathname);

  if (!user && shouldRequireAuth) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/alpha/:path*",
    "/credits/:path*",
    "/dashboard/:path*",
    "/demo/:path*",
    "/feedback/:path*",
    "/match/:path*",
    "/mentor/:path*",
    "/onboarding/:path*",
    "/reflection/:path*",
    "/settings/:path*",
    "/welcome/:path*",
  ],
};
