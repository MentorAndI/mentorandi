import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";
import type { LlmProviderName } from "@/services/llm/llm.types";

type HealthStatus = "ok" | "degraded";
type DatabaseStatus = "connected" | "error";
type AuthStatus = "configured" | "missing";
type HealthLlmProvider = LlmProviderName | "invalid" | "missing" | "routed";

interface HealthCheckResponse {
  app: "Mentor And I";
  auth: AuthStatus;
  database: DatabaseStatus;
  environment: "development" | "production";
  llmProvider: HealthLlmProvider;
  messages?: string[];
  status: HealthStatus;
  timestamp: string;
}

const supportedProviders: LlmProviderName[] = ["mock", "openai", "anthropic"];

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabase();
  const auth = checkAuthConfiguration();
  const llmProvider = checkLlmProviderConfiguration();
  const messages = buildHealthMessages(llmProvider);
  const status =
    database === "connected" &&
    auth === "configured" &&
    llmProvider.isConfigured
      ? "ok"
      : "degraded";

  const response: HealthCheckResponse = {
    app: "Mentor And I",
    auth,
    database,
    environment: getEnvironmentLabel(),
    llmProvider: llmProvider.name,
    ...(messages.length > 0 ? { messages } : {}),
    status,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: 200 });
}

async function checkDatabase(): Promise<DatabaseStatus> {
  try {
    const prisma = getPrismaClient();

    await prisma.$queryRaw`SELECT 1`;

    return "connected";
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Health check database error", error);
    }

    return "error";
  }
}

function checkAuthConfiguration(): AuthStatus {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    ? "configured"
    : "missing";
}

function checkLlmProviderConfiguration(): {
  isConfigured: boolean;
  name: HealthLlmProvider;
} {
  const configuredProvider = process.env.LLM_PROVIDER?.trim().toLowerCase();

  if (!configuredProvider) {
    return checkRoutedLlmProviderConfiguration();
  }

  if (!supportedProviders.includes(configuredProvider as LlmProviderName)) {
    return {
      isConfigured: false,
      name: "invalid",
    };
  }

  const provider = configuredProvider as LlmProviderName;

  if (provider === "openai") {
    return {
      isConfigured:
        Boolean(process.env.OPENAI_API_KEY?.trim()) &&
        Boolean(process.env.OPENAI_MODEL?.trim()),
      name: provider,
    };
  }

  if (provider === "anthropic") {
    return {
      isConfigured:
        Boolean(process.env.ANTHROPIC_API_KEY?.trim()) &&
        Boolean(process.env.ANTHROPIC_MODEL?.trim()),
      name: provider,
    };
  }

  if (provider === "mock" && process.env.NODE_ENV === "production") {
    return {
      isConfigured: false,
      name: provider,
    };
  }

  return {
    isConfigured: true,
    name: provider,
  };
}

function checkRoutedLlmProviderConfiguration(): {
  isConfigured: boolean;
  name: HealthLlmProvider;
} {
  const routeConfigs = [
    {
      model: process.env.LLM_DEFAULT_MODEL?.trim(),
      provider: process.env.LLM_DEFAULT_PROVIDER?.trim().toLowerCase(),
    },
    {
      model: process.env.LLM_CHEAP_MODEL?.trim(),
      provider: process.env.LLM_CHEAP_PROVIDER?.trim().toLowerCase(),
    },
    {
      model: process.env.LLM_DEEP_MODEL?.trim(),
      provider: process.env.LLM_DEEP_PROVIDER?.trim().toLowerCase(),
    },
  ].filter((config) => config.provider || config.model);

  if (routeConfigs.length === 0) {
    return {
      isConfigured: false,
      name: "missing",
    };
  }

  const isConfigured = routeConfigs.every((config) => {
    if (
      config.provider !== "openai" &&
      config.provider !== "anthropic"
    ) {
      return false;
    }

    if (!config.model) {
      return false;
    }

    return config.provider === "openai"
      ? Boolean(process.env.OPENAI_API_KEY?.trim())
      : Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  });

  return {
    isConfigured,
    name: isConfigured ? "routed" : "invalid",
  };
}

function buildHealthMessages(llmProvider: {
  isConfigured: boolean;
  name: HealthLlmProvider;
}) {
  const messages: string[] = [];

  if (
    process.env.NODE_ENV === "production" &&
    llmProvider.name === "mock"
  ) {
    messages.push(
      "Production alpha requires a real LLM provider: openai or anthropic.",
    );
  }

  return messages;
}

function getEnvironmentLabel(): HealthCheckResponse["environment"] {
  if (process.env.NODE_ENV === "production") {
    return "production";
  }

  return "development";
}
