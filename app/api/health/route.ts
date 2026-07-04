import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";
import type { LlmProviderName } from "@/services/llm/llm.types";

type HealthStatus = "ok" | "degraded";
type DatabaseStatus = "connected" | "error";
type AuthStatus = "configured" | "missing";
type HealthLlmProvider = LlmProviderName | "invalid" | "missing";

interface HealthCheckResponse {
  app: "MentorAndI";
  auth: AuthStatus;
  database: DatabaseStatus;
  environment: "development" | "production";
  llmProvider: HealthLlmProvider;
  status: HealthStatus;
  timestamp: string;
}

const supportedProviders: LlmProviderName[] = ["mock", "openai", "anthropic"];

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabase();
  const auth = checkAuthConfiguration();
  const llmProvider = checkLlmProviderConfiguration();
  const status =
    database === "connected" &&
    auth === "configured" &&
    llmProvider.isConfigured
      ? "ok"
      : "degraded";

  const response: HealthCheckResponse = {
    app: "MentorAndI",
    auth,
    database,
    environment: getEnvironmentLabel(),
    llmProvider: llmProvider.name,
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
    return {
      isConfigured: false,
      name: "missing",
    };
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

  return {
    isConfigured: true,
    name: provider,
  };
}

function getEnvironmentLabel(): HealthCheckResponse["environment"] {
  if (process.env.NODE_ENV === "production") {
    return "production";
  }

  return "development";
}
