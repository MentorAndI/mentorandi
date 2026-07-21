import "dotenv/config";

const defaultBaseUrl = "http://localhost:3000";
const baseUrl = normalizeBaseUrl(process.env.APP_URL?.trim() || defaultBaseUrl);
const isDevelopment = process.env.NODE_ENV !== "production";

const checks = [
  { path: "/api/health", redirectsAllowed: false },
  { path: "/login", redirectsAllowed: false },
  { path: "/signup", redirectsAllowed: false },
  { path: "/forgot-password", redirectsAllowed: false },
  { path: "/alpha", redirectsAllowed: false },
  { path: "/demo", redirectsAllowed: false },
  { path: "/mentors", redirectsAllowed: false },
  { path: "/privacy", redirectsAllowed: false },
  { path: "/terms", redirectsAllowed: false },
  { path: "/contact", redirectsAllowed: false },
  { path: "/start", redirectsAllowed: false },
  { path: "/mentor", redirectsAllowed: true },
  { path: "/settings", redirectsAllowed: true },
  { path: "/admin", redirectsAllowed: true },
  { path: "/admin/feedback", redirectsAllowed: true },
  { path: "/admin/usage", redirectsAllowed: true },
];

if (isDevelopment) {
  checks.push({ path: "/dev/mentor-test", redirectsAllowed: false });
}

console.log("MentorAndI Alpha Smoke Test");
console.log(`Base URL: ${baseUrl}`);

const results = [];

for (const check of checks) {
  results.push(await runCheck(check));
}

const failures = results.filter((result) => !result.passed);

for (const result of results) {
  const statusText = result.redirected
    ? `${result.status} redirect`
    : String(result.status);

  console.log(`${result.passed ? "PASS" : "FAIL"} ${result.path} ${statusText}`);
}

if (failures.length > 0) {
  console.error(`${failures.length} alpha smoke check failed.`);
  process.exit(1);
}

console.log("Alpha smoke test passed.");

async function runCheck(check) {
  const url = new URL(check.path, baseUrl);

  try {
    const response = await fetch(url, {
      redirect: "manual",
    });
    const redirected = isRedirectStatus(response.status);
    const passed =
      response.status < 500 && (!redirected || check.redirectsAllowed);

    return {
      passed,
      path: check.path,
      redirected,
      status: response.status,
    };
  } catch {
    return {
      passed: false,
      path: check.path,
      redirected: false,
      status: "unreachable",
    };
  }
}

function isRedirectStatus(status) {
  return status >= 300 && status < 400;
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
