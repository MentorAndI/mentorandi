import type {
  CheckAndRecordUsageInput,
  UsageLimitConfig,
  UsageLimitCounterSnapshot,
  UsageLimitDecision,
  UsageLimitScope,
  UsageLimitStatus,
} from "@/services/usage-limits/usage-limits.types";

interface UsageCounter {
  dailyCount: number;
  dailyPeriod: string;
  monthlyCount: number;
  monthlyPeriod: string;
}

const globalUsageStore = globalThis as typeof globalThis & {
  __mentorandiUsageLimitCounters?: Map<string, UsageCounter>;
};

const usageCounters =
  globalUsageStore.__mentorandiUsageLimitCounters ??
  new Map<string, UsageCounter>();

globalUsageStore.__mentorandiUsageLimitCounters = usageCounters;

export class UsageLimitService {
  checkAndRecord(input: CheckAndRecordUsageInput): UsageLimitDecision {
    const config = readUsageLimitConfig();
    const now = new Date();
    const dailyPeriod = toDailyPeriod(now);
    const monthlyPeriod = toMonthlyPeriod(now);
    const key = buildUsageKey(input.scope, input.subjectId);
    const counter = getCurrentCounter(key, dailyPeriod, monthlyPeriod);
    const nextDailyCount = counter.dailyCount + 1;
    const nextMonthlyCount = counter.monthlyCount + 1;

    if (
      config.enforceLimits &&
      config.dailyRequestLimit !== null &&
      nextDailyCount > config.dailyRequestLimit
    ) {
      return buildDecision(input.scope, "daily-limit-reached", counter, config);
    }

    if (
      config.enforceLimits &&
      config.monthlyRequestLimit !== null &&
      nextMonthlyCount > config.monthlyRequestLimit
    ) {
      return buildDecision(
        input.scope,
        "monthly-limit-reached",
        counter,
        config,
      );
    }

    counter.dailyCount = nextDailyCount;
    counter.monthlyCount = nextMonthlyCount;
    usageCounters.set(key, counter);

    return buildDecision(
      input.scope,
      config.enforceLimits ? "allowed" : "tracking-only",
      counter,
      config,
    );
  }
}

export function readUsageLimitConfig(): UsageLimitConfig {
  return {
    dailyRequestLimit: readOptionalPositiveInteger(
      "MENTOR_DAILY_REQUEST_LIMIT",
    ),
    enforceLimits: shouldEnforceUsageLimits(),
    monthlyRequestLimit: readOptionalPositiveInteger(
      "MENTOR_MONTHLY_REQUEST_LIMIT",
    ),
  };
}

export function isUsageLimitReached(status: UsageLimitStatus) {
  return status === "daily-limit-reached" || status === "monthly-limit-reached";
}

function shouldEnforceUsageLimits() {
  const configuredValue = process.env.USAGE_LIMITS_ENABLED?.trim().toLowerCase();

  if (configuredValue === "true") {
    return true;
  }

  if (configuredValue === "false") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

function getCurrentCounter(
  key: string,
  dailyPeriod: string,
  monthlyPeriod: string,
): UsageCounter {
  const existingCounter = usageCounters.get(key);
  const counter = existingCounter ?? {
    dailyCount: 0,
    dailyPeriod,
    monthlyCount: 0,
    monthlyPeriod,
  };

  if (counter.dailyPeriod !== dailyPeriod) {
    counter.dailyCount = 0;
    counter.dailyPeriod = dailyPeriod;
  }

  if (counter.monthlyPeriod !== monthlyPeriod) {
    counter.monthlyCount = 0;
    counter.monthlyPeriod = monthlyPeriod;
  }

  return counter;
}

function buildDecision(
  scope: UsageLimitScope,
  status: UsageLimitDecision["status"],
  counter: UsageCounter,
  config: UsageLimitConfig,
): UsageLimitDecision {
  return {
    daily: buildSnapshot(
      counter.dailyCount,
      counter.dailyPeriod,
      config.dailyRequestLimit,
    ),
    monthly: buildSnapshot(
      counter.monthlyCount,
      counter.monthlyPeriod,
      config.monthlyRequestLimit,
    ),
    scope,
    status,
  };
}

function buildSnapshot(
  count: number,
  period: string,
  limit: number | null,
): UsageLimitCounterSnapshot {
  return {
    count,
    limit,
    period,
    remaining: limit === null ? null : Math.max(limit - count, 0),
  };
}

function buildUsageKey(scope: UsageLimitScope, subjectId: string) {
  return `${scope}:${subjectId}`;
}

function toDailyPeriod(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toMonthlyPeriod(date: Date) {
  return date.toISOString().slice(0, 7);
}

function readOptionalPositiveInteger(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}
