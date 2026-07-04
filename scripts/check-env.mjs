import "dotenv/config";

const requiredVariables = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "LLM_PROVIDER",
];

const supportedProviders = ["mock", "openai", "anthropic"];
const providerSpecificVariables = {
  anthropic: ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"],
  openai: ["OPENAI_API_KEY", "OPENAI_MODEL"],
};

const missingVariables = [...requiredVariables];
const provider = process.env.LLM_PROVIDER?.trim().toLowerCase();
const isProduction = process.env.NODE_ENV === "production";
const errors = [];
const warnings = [];

for (const variableName of requiredVariables) {
  if (hasEnvironmentValue(variableName)) {
    removeMissingVariable(variableName);
  }
}

if (provider) {
  if (!supportedProviders.includes(provider)) {
    errors.push("LLM_PROVIDER must be mock, openai or anthropic.");
  }

  const providerVariables = providerSpecificVariables[provider] ?? [];

  for (const variableName of providerVariables) {
    if (!hasEnvironmentValue(variableName)) {
      missingVariables.push(variableName);
    }
  }

  if (provider === "mock" && isProduction) {
    errors.push(
      "LLM_PROVIDER=mock is not allowed for production alpha. Use openai or anthropic.",
    );
  } else if (provider === "mock") {
    warnings.push(
      "LLM_PROVIDER=mock is intended for development and deterministic testing, not real production users.",
    );
  }
}

if (missingVariables.length > 0 || errors.length > 0) {
  console.error("Environment validation failed.");

  if (missingVariables.length > 0) {
    console.error("Missing required variables:");

    for (const variableName of missingVariables) {
      console.error(`- ${variableName}`);
    }
  }

  for (const error of errors) {
    console.error(error);
  }

  process.exit(1);
}

console.log("Environment validation passed.");

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`);
}

function hasEnvironmentValue(variableName) {
  return Boolean(process.env[variableName]?.trim());
}

function removeMissingVariable(variableName) {
  const index = missingVariables.indexOf(variableName);

  if (index >= 0) {
    missingVariables.splice(index, 1);
  }
}
