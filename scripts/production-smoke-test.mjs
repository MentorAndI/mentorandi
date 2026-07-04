import "dotenv/config";

const defaultHealthUrl = "http://localhost:3000/api/health";
const healthUrl = getHealthUrl();

try {
  const response = await fetch(healthUrl);
  const responseText = await response.text();

  if (!response.ok) {
    console.error(`Health check failed with HTTP ${response.status}.`);
    process.exit(1);
  }

  if (containsSensitiveValue(responseText)) {
    console.error(
      "Health check failed because the response appears to expose a sensitive environment value.",
    );
    process.exit(1);
  }

  const health = parseHealthResponse(responseText);

  if (!health) {
    console.error("Health check failed because the response was not valid JSON.");
    process.exit(1);
  }

  if (health.status !== "ok" && health.status !== "degraded") {
    console.error("Health check failed because status was not ok or degraded.");
    process.exit(1);
  }

  console.log("Production smoke test passed.");
  console.log(`URL: ${healthUrl}`);
  console.log(`Status: ${health.status}`);
  console.log(`Environment: ${health.environment ?? "unknown"}`);
  console.log(`Database: ${health.database ?? "unknown"}`);
  console.log(`Auth: ${health.auth ?? "unknown"}`);
  console.log(`LLM provider: ${health.llmProvider ?? "unknown"}`);
} catch (error) {
  console.error(`Unable to reach health endpoint: ${healthUrl}`);
  console.error(error instanceof Error ? error.message : "Unknown error.");
  process.exit(1);
}

function getHealthUrl() {
  const appUrl = process.env.APP_URL?.trim();

  if (!appUrl) {
    return defaultHealthUrl;
  }

  if (appUrl.endsWith("/api/health")) {
    return appUrl;
  }

  return new URL("/api/health", appUrl).toString();
}

function containsSensitiveValue(responseText) {
  const sensitiveVariableNames = [
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
  ];

  return sensitiveVariableNames.some((variableName) => {
    const value = process.env[variableName]?.trim();

    return Boolean(value && responseText.includes(value));
  });
}

function parseHealthResponse(responseText) {
  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}
