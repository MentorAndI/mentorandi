import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getSafeAuthRedirectPath,
  normalizeSafeAuthNextPath,
} from "@/services/auth/redirects";
import {
  isDevelopmentProtectedRouteBypass,
  isProtectedAuthRoute,
} from "@/services/auth/routes";

test("signup and callback redirects preserve safe product destinations", () => {
  assert.equal(normalizeSafeAuthNextPath("/onboarding?plan=free"), "/onboarding?plan=free");
  assert.equal(normalizeSafeAuthNextPath("/mentor?mentor=life"), "/mentor?mentor=life");
  assert.equal(normalizeSafeAuthNextPath("/feedback?context=%2Fmentor"), "/feedback?context=%2Fmentor");
});

test("signup and callback redirects reject external and privileged destinations", () => {
  assert.equal(normalizeSafeAuthNextPath("https://example.com/mentor"), "/onboarding");
  assert.equal(normalizeSafeAuthNextPath("//example.com/mentor"), "/onboarding");
  assert.equal(normalizeSafeAuthNextPath("/api/me"), "/onboarding");
  assert.equal(normalizeSafeAuthNextPath("/admin"), "/onboarding");
});

test("login redirects reject open redirects and auth loops", () => {
  assert.equal(getSafeAuthRedirectPath("https://example.com", "/onboarding"), "/onboarding");
  assert.equal(getSafeAuthRedirectPath("//example.com", "/onboarding"), "/onboarding");
  assert.equal(getSafeAuthRedirectPath("/login", "/onboarding"), "/onboarding");
  assert.equal(getSafeAuthRedirectPath("/feedback", "/onboarding"), "/feedback");
});

test("production-facing account, mentor, feedback, and admin routes are protected", () => {
  for (const route of [
    "/admin",
    "/admin/feedback",
    "/admin/usage",
    "/feedback",
    "/mentor",
    "/onboarding",
    "/settings",
  ]) {
    assert.equal(isProtectedAuthRoute(route), true, route);
  }

  assert.equal(isProtectedAuthRoute("/alpha"), false);
  assert.equal(isProtectedAuthRoute("/privacy"), false);
});

test("development bypass never includes onboarding, feedback, or admin", () => {
  assert.equal(isDevelopmentProtectedRouteBypass("/feedback"), false);
  assert.equal(isDevelopmentProtectedRouteBypass("/onboarding"), false);
  assert.equal(isDevelopmentProtectedRouteBypass("/admin"), false);
});
