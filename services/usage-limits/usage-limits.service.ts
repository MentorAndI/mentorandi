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
  weeklyCount: number;
  weeklyPeriod: string;
}

const globalUsageStore = globalThis as typeof globalThis & {
  __mentorandiUsageLimitCounters?: Map<string, UsageCounter>;
};

const usageCounters =
  globalUsageStore.__mentorandiUsageLimitCounters ??
  new Map<string, UsageCounter>();

globalUsageStore.__mentorandiUsageLimitCounters = usageCounters;

export class UsageLimitService {
  check(input: CheckAndRecordUsageInput): UsageLimitDecision {
    const config = readUsageLimitConfig();
    const periods = getCurrentPeriods();
    const key = buildUsageKey(input.scope, input.subjectId);
    const counter = getCurrentCounter(key, periods);

    return buildDecisionForNextCount(input.scope, counter, config);
  }

  record(input: CheckAndRecordUsageInput): UsageLimitDecision {
    const config = readUsageLimitConfig();
    const periods = getCurrentPeriods();
    const key = buildUsageKey(input.scope, input.subjectId);
    const counter = getCurrentCounter(key, periods);

    counter.dailyCount += 1;
    counter.weeklyCount += 1;
    counter.monthlyCount += 1;
    usageCounters.set(key, counter);

    return buildDecision(
      input.scope,
      config.enforceLimits ? "allowed" : "tracking-only",
      counter,
      config,
    );
  }

  checkAndRecord(input: CheckAndRecordUsageInput): UsageLimitDecision {
    const decision = this.check(input);

    return isUsageLimitReached(decision.status) ? decision : this.record(input);
  }
}

export function readUsageLimitConfig(): UsageLimitConfig {
  return {
    dailyMessageLimit: readPositiveInteger(
      "ALPHA_DAILY_MESSAGE_LIMIT",
      readOptionalPositiveInteger("MENTOR_DAILY_REQUEST_LIMIT") ?? 25,
    ),
    enforceLimits: shouldEnforceUsageLimits(),
    monthlyMessageLimit: readPositiveInteger(
      "ALPHA_MONTHLY_MESSAGE_LIMIT",
      readOptionalPositiveInteger("MENTOR_MONTHLY_REQUEST_LIMIT") ?? 300,
    ),
    weeklyDeepLimit: readPositiveInteger("ALPHA_WEEKLY_DEEP_LIMIT", 5),
    weeklyMessageLimit: readPositiveInteger("ALPHA_WEEKLY_MESSAGE_LIMIT", 100),
  };
}

export function isUsageLimitReached(status: UsageLimitStatus) {
  return (
    status === "daily-limit-reached" ||
    status === "monthly-limit-reached" ||
    status === "weekly-limit-reached"
  );
}

export function getUsageLimitMessage(status: UsageLimitStatus) {
  if (status === "daily-limit-reached") {
    return "You've reached your alpha daily usage limit. Please try again later.";
  }

  if (status === "weekly-limit-reached") {
    return "You've reached your alpha weekly usage limit. Please try again later.";
  }

  if (status === "monthly-limit-reached") {
    return "You've reached your alpha monthly usage limit. Please try again later.";
  }

  return "You've reached your alpha usage limit. Please try again later.";
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

function getCurrentCounter(key: string, periods: UsagePeriods): UsageCounter {
  const existingCounter = usageCounters.get(key);
  const counter = existingCounter ?? {
    dailyCount: 0,
    dailyPeriod: periods.daily,
    monthlyCount: 0,
    monthlyPeriod: periods.monthly,
    weeklyCount: 0,
    weeklyPeriod: periods.weekly,
  };

  if (counter.dailyPeriod !== periods.daily) {
    counter.dailyCount = 0;
    counter.dailyPeriod = periods.daily;
  }

  if (counter.weeklyPeriod !== periods.weekly) {
    counter.weeklyCount = 0;
    counter.weeklyPeriod = periods.weekly;
  }

  if (counter.monthlyPeriod !== periods.monthly) {
    counter.monthlyCount = 0;
    counter.monthlyPeriod = periods.monthly;
  }

  return counter;
}

function buildDecisionForNextCount(
  scope: UsageLimitScope,
  counter: UsageCounter,
  config: UsageLimitConfig,
): UsageLimitDecision {
  const nextCounter = {
    ...counter,
    dailyCount: counter.dailyCount + 1,
    monthlyCount: counter.monthlyCount + 1,
    weeklyCount: counter.weeklyCount + 1,
  };

  if (config.enforceLimits) {
    const dailyLimit = getDailyLimitForScope(scope, config);
    const weeklyLimit = getWeeklyLimitForScope(scope, config);
    const monthlyLimit = getMonthlyLimitForScope(scope, config);

    if (dailyLimit !== null && nextCounter.dailyCount > dailyLimit) {
      return buildDecision(scope, "daily-limit-reached", counter, config);
    }

    if (weeklyLimit !== null && nextCounter.weeklyCount > weeklyLimit) {
      return buildDecision(scope, "weekly-limit-reached", counter, config);
    }

    if (monthlyLimit !== null && nextCounter.monthlyCount > monthlyLimit) {
      return buildDecision(scope, "monthly-limit-reached", counter, config);
    }
  }

  return buildDecision(
    scope,
    config.enforceLimits ? "allowed" : "tracking-only",
    counter,
    config,
  );
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
      getDailyLimitForScope(scope, config),
    ),
    monthly: buildSnapshot(
      counter.monthlyCount,
      counter.monthlyPeriod,
      getMonthlyLimitForScope(scope, config),
    ),
    scope,
    status,
    weekly: buildSnapshot(
      counter.weeklyCount,
      counter.weeklyPeriod,
      getWeeklyLimitForScope(scope, config),
    ),
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

function toWeeklyPeriod(date: Date) {
  const weekDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
  const day = weekDate.getUTCDay() || 7;

  weekDate.setUTCDate(weekDate.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(weekDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((weekDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );

  return `${weekDate.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function toMonthlyPeriod(date: Date) {
  return date.toISOString().slice(0, 7);
}

interface UsagePeriods {
  daily: string;
  monthly: string;
  weekly: string;
}

function getCurrentPeriods(): UsagePeriods {
  const now = new Date();

  return {
    daily: toDailyPeriod(now),
    monthly: toMonthlyPeriod(now),
    weekly: toWeeklyPeriod(now),
  };
}

function getDailyLimitForScope(
  scope: UsageLimitScope,
  config: UsageLimitConfig,
) {
  return scope === "mentor-message" ? config.dailyMessageLimit : null;
}

function getWeeklyLimitForScope(
  scope: UsageLimitScope,
  config: UsageLimitConfig,
) {
  if (scope === "mentor-message") {
    return config.weeklyMessageLimit;
  }

  if (scope === "mentor-deep-model") {
    return config.weeklyDeepLimit;
  }

  return null;
}

function getMonthlyLimitForScope(
  scope: UsageLimitScope,
  config: UsageLimitConfig,
) {
  return scope === "mentor-message" ? config.monthlyMessageLimit : null;
}

function readPositiveInteger(name: string, fallback: number) {
  return readOptionalPositiveInteger(name) ?? fallback;
}

function readOptionalPositiveInteger(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}
