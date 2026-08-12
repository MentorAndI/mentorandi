import "dotenv/config";

const defaultBaseUrl = "http://localhost:3000";
const baseUrl = normalizeBaseUrl(process.env.APP_URL?.trim() || defaultBaseUrl);
const isProductionTarget =
  process.env.NODE_ENV === "production" ||
  !["127.0.0.1", "localhost"].includes(new URL(baseUrl).hostname);

const results = [];

console.log("MentorAndI External Alpha Readiness Gate");
console.log(`Base URL: ${baseUrl}`);

await checkHealth();

await checkPage("public signup", "/signup", [
  "Create your account",
  "continue to onboarding",
]);
await checkPage("public login", "/login", ["Log in", "Forgot password?"]);
await checkPage("alpha tester guide", "/alpha", [
  "external alpha",
  "Create an account",
  "Verify your email",
]);
await checkPage("mentor selection", "/mentors", [
  "Choose the kind of support you need",
  "Life Mentor",
  "Charisma Mentor",
]);
await checkPage("first conversation entry", "/start", [
  "What brought you here today?",
  "Create an account to save your first mentor conversation",
]);
await checkPage("privacy trust page", "/privacy", [
  "Privacy",
  "We do not sell your personal data",
]);
await checkPage("terms trust page", "/terms", [
  "Mentoring, not professional advice",
  "Emergencies and crisis situations",
]);
await checkPage("contact trust page", "/contact", [
  "support@mentorandi.com",
  "Share feedback",
]);
await checkPage("pricing disclosure", "/pricing", [
  "external alpha tester signups",
  "Email verification required",
]);
await checkPage("demo route", "/demo", [
  "One mentoring engine",
  "Private alpha",
]);

for (const path of [
  "/mentor",
  "/mentor?mentor=life",
  "/onboarding",
  "/feedback",
  "/settings",
  "/admin",
  "/admin/feedback",
  "/admin/usage",
]) {
  await checkProtectedRedirect(path);
}

await checkStatus("current-user API rejects logged-out access", "/api/me", 401);
await checkStatus(
  "Life Mentor session API rejects logged-out access",
  "/api/mentor/session?mentor=life",
  401,
);
await checkStatus(
  "conversation list API rejects logged-out access",
  "/api/conversations",
  401,
);
await checkStatus(
  "feedback API rejects logged-out submissions",
  "/api/feedback",
  401,
  {
    body: JSON.stringify({ category: "OTHER", message: "Readiness check" }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  },
);
await checkStatus(
  "mentor creation API rejects logged-out access",
  "/api/mentor-session/new",
  401,
  {
    body: JSON.stringify({ mentor: "life" }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  },
);
await checkStatus(
  "signup API validates required fields without an invite gate",
  "/api/auth/signup",
  400,
  {
    body: JSON.stringify({ email: "", password: "" }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  },
  "Email and password are required",
);
await checkAuthCallbackFailure();

if (isProductionTarget) {
  await checkStatus("development mentor route is blocked", "/dev/mentor-test", 404);
}

const staleInvitePattern = /invite code|invite required|sign up with invite/i;

for (const path of ["/alpha", "/signup", "/pricing"]) {
  const response = await request(path);
  const body = await response.text();
  record(
    `obsolete invite-gate copy is absent from ${path}`,
    response.status === 200 && !staleInvitePattern.test(body),
    response.status === 200 && !staleInvitePattern.test(body)
      ? "checked"
      : response.status === 200
        ? "stale invite-gate wording found"
      : `HTTP ${response.status}`,
  );
}

for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"} ${result.name}${result.detail ? ` — ${result.detail}` : ""}`);
}

const failures = results.filter((result) => !result.passed);

if (failures.length > 0) {
  console.error(`${failures.length} alpha-readiness check(s) failed.`);
  process.exit(1);
}

console.log(`External alpha readiness gate passed (${results.length} checks).`);

async function checkHealth() {
  const response = await request("/api/health");
  const text = await response.text();
  let health;

  try {
    health = JSON.parse(text);
  } catch {
    health = null;
  }

  const safePayload =
    !/DATABASE_URL|OPENAI_API_KEY|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE/i.test(text);
  const configured =
    health?.status === "ok" &&
    health?.database === "connected" &&
    health?.auth === "configured" &&
    health?.environment === (isProductionTarget ? "production" : health?.environment) &&
    health?.llmProvider !== "mock";

  record("health, database, auth, and real-provider status", response.status === 200 && configured, `HTTP ${response.status}`);
  record("health response contains no secret field names", safePayload);
}

async function checkPage(name, path, markers) {
  const response = await request(path);
  const body = await response.text();
  const missing = markers.filter((marker) => !body.toLowerCase().includes(marker.toLowerCase()));

  record(name, response.status === 200 && missing.length === 0, missing.length > 0 ? `missing: ${missing.join(", ")}` : `HTTP ${response.status}`);
}

async function checkProtectedRedirect(path) {
  const response = await request(path);
  const location = response.headers.get("location");
  const redirectUrl = location ? new URL(location, baseUrl) : null;
  const expectedNext = new URL(path, baseUrl);
  const expectedPath = `${expectedNext.pathname}${expectedNext.search}`;
  const passed =
    isRedirectStatus(response.status) &&
    redirectUrl?.pathname === "/login" &&
    redirectUrl.searchParams.get("next") === expectedPath;

  record(`logged-out ${path} redirect`, passed, `HTTP ${response.status}; location ${location ?? "missing"}`);
}

async function checkStatus(name, path, expectedStatus, init, expectedBodyText) {
  const response = await request(path, init);
  const body = await response.text();
  const bodyMatches = !expectedBodyText || body.includes(expectedBodyText);

  record(name, response.status === expectedStatus && bodyMatches, `HTTP ${response.status}`);
}

async function checkAuthCallbackFailure() {
  const response = await request("/auth/callback");
  const location = response.headers.get("location");
  const redirectUrl = location ? new URL(location, baseUrl) : null;
  const passed =
    isRedirectStatus(response.status) &&
    redirectUrl?.pathname === "/login" &&
    redirectUrl.searchParams.get("error") === "auth_callback_failed";

  record("invalid auth callback fails safely", passed, `HTTP ${response.status}; location ${location ?? "missing"}`);
}

function record(name, passed, detail = "") {
  results.push({ detail, name, passed });
}

function request(path, init = {}) {
  return fetch(new URL(path, baseUrl), { ...init, redirect: "manual" });
}

function isRedirectStatus(status) {
  return status >= 300 && status < 400;
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
