import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildLoginPath,
  buildSignupPath,
  getSafeAuthRedirectPath,
  normalizeSafeAuthNextPath,
} from "@/services/auth/redirects";
import {
  buildOnboardingPath,
  getPaidPlanDetails,
  normalizeRequestedPlan,
} from "@/services/billing/purchase-flow";
import {
  isDevelopmentProtectedRouteBypass,
  isProductionAppRuntime,
  isProductionHiddenLegacyRoute,
  isProtectedAuthRoute,
} from "@/services/auth/routes";
import {
  validateAgeConfirmation,
  validateSignupForm,
} from "@/services/auth/validation";

test("signup and callback redirects preserve safe product destinations", () => {
  for (const plan of ["free", "single", "plus", "premium"] as const) {
    const onboardingPath = `/onboarding?plan=${plan}`;

    assert.equal(buildOnboardingPath(plan), onboardingPath);
    assert.equal(normalizeSafeAuthNextPath(onboardingPath), onboardingPath);
    assert.equal(
      buildLoginPath(onboardingPath),
      `/login?next=${encodeURIComponent(onboardingPath)}`,
    );
    assert.equal(
      buildSignupPath(onboardingPath),
      `/signup?next=${encodeURIComponent(onboardingPath)}`,
    );
  }

  assert.equal(normalizeSafeAuthNextPath("/mentor?mentor=life"), "/mentor?mentor=life");
  assert.equal(normalizeSafeAuthNextPath("/credits?topup=returned"), "/credits?topup=returned");
  assert.equal(normalizeSafeAuthNextPath("/feedback?context=%2Fmentor"), "/feedback?context=%2Fmentor");
});

test("paid plans resolve to payment confirmation details before mentor intake", () => {
  for (const plan of ["single", "plus", "premium"] as const) {
    const details = getPaidPlanDetails(normalizeRequestedPlan(plan));

    assert.ok(details);
    assert.equal(details.publicPlan, plan);
    assert.match(buildOnboardingPath(plan), /^\/onboarding\?plan=/);
  }
});

test("free signup has no Stripe checkout plan", () => {
  assert.equal(getPaidPlanDetails(normalizeRequestedPlan("free")), null);
  assert.equal(normalizeRequestedPlan("unexpected"), "free");
});

test("signup requires affirmative 18 plus confirmation", () => {
  assert.equal(validateAgeConfirmation(false), "You must confirm that you are 18 years of age or older.");
  assert.equal(validateAgeConfirmation(true), null);

  const withoutConfirmation = validateSignupForm(
    "adult@example.com",
    "password123",
    "password123",
    false,
  );
  assert.equal(withoutConfirmation.isValid, false);
  assert.equal(
    withoutConfirmation.errors.ageConfirmation,
    "You must confirm that you are 18 years of age or older.",
  );

  const confirmed = validateSignupForm(
    "adult@example.com",
    "password123",
    "password123",
    true,
  );
  assert.equal(confirmed.isValid, true);
  assert.equal(confirmed.errors.ageConfirmation, undefined);
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
    "/credits",
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

test("legacy prototype routes are hidden from the production app host", () => {
  for (const route of [
    "/alpha",
    "/demo",
    "/match",
    "/reflection",
    "/welcome",
    "/demo/scenario",
  ]) {
    assert.equal(isProductionHiddenLegacyRoute(route), true, route);
  }

  for (const route of ["/", "/login", "/pricing", "/privacy", "/terms", "/mentors"]) {
    assert.equal(isProductionHiddenLegacyRoute(route), false, route);
  }
});

test("production runtime is identified from APP_URL rather than proxy hostname", () => {
  assert.equal(isProductionAppRuntime("https://app.mentorandi.com"), true);
  assert.equal(isProductionAppRuntime("https://app.mentorandi.com/"), true);
  assert.equal(isProductionAppRuntime("https://staging.mentorandi.com"), false);
  assert.equal(isProductionAppRuntime("http://app.mentorandi.com"), false);
  assert.equal(isProductionAppRuntime("not-a-url"), false);
  assert.equal(isProductionAppRuntime(undefined), false);
});

test("development bypass never includes onboarding, feedback, or admin", () => {
  assert.equal(isDevelopmentProtectedRouteBypass("/feedback"), false);
  assert.equal(isDevelopmentProtectedRouteBypass("/onboarding"), false);
  assert.equal(isDevelopmentProtectedRouteBypass("/admin"), false);
});
