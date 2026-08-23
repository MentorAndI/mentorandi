import {
  CreditTransactionType,
  SubscriptionPlan,
} from "@/lib/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import type { MentorResponsePipelineLlmUsage } from "@/services/mentor-core/response-pipeline/response-pipeline.types";
import {
  calculateCreditsForProviderCost,
  calculateProviderCostUsd,
  calculateRetailCostUsd,
  CREDIT_RETAIL_VALUE_USD,
} from "@/services/credits/credit-pricing";

export const FREE_TRIAL_STARTER_CREDITS = 25;

const planCreditAllocations: Partial<Record<SubscriptionPlan, number>> = {
  COMPANY_STRESS: 5000,
  FOUNDER: 5000,
  PERSONAL: 2000,
  PLUS: 2000,
  PREMIUM: 5000,
  SINGLE: 800,
};

export interface CreditBalanceSnapshot {
  balance: number;
  planBalance: number;
  topUpBalance: number;
  creditRetailValueUsd: number;
}

export interface ApplyPlanCreditsInput {
  billingSubscriptionId?: string | null;
  periodEnd: Date;
  plan: SubscriptionPlan;
  userId: string;
}

export interface DebitUsageCreditsInput {
  llmUsage: MentorResponsePipelineLlmUsage;
  usageEventId: string;
  userId: string;
}

export class CreditServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly upgradeMessage?: string,
  ) {
    super(message);
    this.name = "CreditServiceError";
  }
}

export class CreditService {
  private readonly prisma = getPrismaClient();

  async getBalanceForUser(userId: string): Promise<CreditBalanceSnapshot> {
    const account = await this.ensureCreditAccount(userId);
    return toBalanceSnapshot(account);
  }

  async assertCreditsAvailable(userId: string) {
    const balance = await this.getBalanceForUser(userId);

    if (balance.balance <= 0) {
      throw new CreditServiceError(
        "You have used your available mentor credits.",
        402,
        "Upgrade your plan or wait for your next monthly credit refill.",
      );
    }

    return balance;
  }

  async applyPlanCredits(input: ApplyPlanCreditsInput) {
    const allocation = planCreditAllocations[input.plan];
    if (!allocation) return this.getBalanceForUser(input.userId);

    const periodKey = [
      "plan",
      input.billingSubscriptionId ?? input.userId,
      input.plan,
      input.periodEnd.toISOString(),
    ].join(":");

    const account = await this.prisma.$transaction(async (tx) => {
      const current = await tx.creditAccount.upsert({
        create: {
          lifetimeGranted: 0,
          lifetimeUsed: 0,
          planBalance: 0,
          topUpBalance: 0,
          userId: input.userId,
        },
        update: {},
        where: { userId: input.userId },
      });

      if (current.periodKey === periodKey) {
        return current;
      }

      const currentPlanBalance = decimalToNumber(current.planBalance);
      const currentTopUpBalance = decimalToNumber(current.topUpBalance);

      if (currentPlanBalance !== 0) {
        await tx.creditTransaction.create({
          data: {
            accountId: current.id,
            amount: -currentPlanBalance,
            balanceAfter: currentTopUpBalance,
            idempotencyKey: `reset:${periodKey}`,
            type: CreditTransactionType.PLAN_RESET,
            userId: input.userId,
          },
        });
      }

      const nextBalance = currentTopUpBalance + allocation;

      await tx.creditTransaction.create({
        data: {
          accountId: current.id,
          amount: allocation,
          balanceAfter: nextBalance,
          idempotencyKey: `grant:${periodKey}`,
          type: CreditTransactionType.PLAN_GRANT,
          userId: input.userId,
        },
      });

      return tx.creditAccount.update({
        data: {
          lifetimeGranted: { increment: allocation },
          periodKey,
          planBalance: allocation,
        },
        where: { id: current.id },
      });
    });

    return toBalanceSnapshot(account);
  }

  async debitUsageCredits(input: DebitUsageCreditsInput) {
    const cost = calculateProviderCostUsd(input.llmUsage);

    if (cost.providerCostUsd === null) {
      // Never invent a debit if token usage or provider pricing is unavailable.
      // The usage event remains auditable and the pricing gap can be fixed
      // without charging a user an arbitrary amount.
      return {
        ...(await this.getBalanceForUser(input.userId)),
        creditsDebited: 0,
        providerCostUsd: null,
        retailCostUsd: null,
      };
    }

    const credits = calculateCreditsForProviderCost(cost.providerCostUsd);
    const retailCostUsd = calculateRetailCostUsd(cost.providerCostUsd);

    if (credits <= 0) {
      return {
        ...(await this.getBalanceForUser(input.userId)),
        creditsDebited: 0,
        providerCostUsd: cost.providerCostUsd,
        retailCostUsd,
      };
    }

    await this.ensureCreditAccount(input.userId);

    const result = await this.prisma.$transaction(async (tx) => {
      const existingDebit = await tx.creditTransaction.findUnique({
        where: { usageEventId: input.usageEventId },
      });

      if (existingDebit) {
        const account = await tx.creditAccount.findUniqueOrThrow({
          where: { userId: input.userId },
        });
        return { account, creditsDebited: Math.abs(decimalToNumber(existingDebit.amount)) };
      }

      const account = await tx.creditAccount.findUniqueOrThrow({
        where: { userId: input.userId },
      });
      let planBalance = decimalToNumber(account.planBalance);
      let topUpBalance = decimalToNumber(account.topUpBalance);
      let remainingDebit = credits;

      const planDebit = Math.min(Math.max(planBalance, 0), remainingDebit);
      planBalance -= planDebit;
      remainingDebit -= planDebit;

      const topUpDebit = Math.min(Math.max(topUpBalance, 0), remainingDebit);
      topUpBalance -= topUpDebit;
      remainingDebit -= topUpDebit;

      // Usage is metered after the provider returns its actual token count. If a
      // final response slightly exceeds the remaining balance, preserve the
      // exact charge as a small negative plan balance and block the next call.
      if (remainingDebit > 0) {
        planBalance -= remainingDebit;
      }

      const balanceAfter = planBalance + topUpBalance;
      const updated = await tx.creditAccount.update({
        data: {
          lifetimeUsed: { increment: credits },
          planBalance,
          topUpBalance,
        },
        where: { id: account.id },
      });

      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          amount: -credits,
          apiCostUsd: cost.providerCostUsd,
          balanceAfter,
          idempotencyKey: `usage:${input.usageEventId}`,
          model: input.llmUsage.model,
          provider: input.llmUsage.provider,
          retailCostUsd,
          type: CreditTransactionType.USAGE_DEBIT,
          usageEventId: input.usageEventId,
          userId: input.userId,
        },
      });

      return { account: updated, creditsDebited: credits };
    });

    return {
      ...toBalanceSnapshot(result.account),
      creditsDebited: result.creditsDebited,
      providerCostUsd: cost.providerCostUsd,
      retailCostUsd,
    };
  }

  private async ensureCreditAccount(userId: string) {
    const existing = await this.prisma.creditAccount.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    const starterKey = `starter:${userId}:v1`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const account = await tx.creditAccount.create({
          data: {
            lifetimeGranted: FREE_TRIAL_STARTER_CREDITS,
            periodKey: "starter:v1",
            planBalance: FREE_TRIAL_STARTER_CREDITS,
            topUpBalance: 0,
            userId,
          },
        });

        await tx.creditTransaction.create({
          data: {
            accountId: account.id,
            amount: FREE_TRIAL_STARTER_CREDITS,
            balanceAfter: FREE_TRIAL_STARTER_CREDITS,
            idempotencyKey: starterKey,
            type: CreditTransactionType.STARTER_GRANT,
            userId,
          },
        });

        return account;
      });
    } catch {
      const racedAccount = await this.prisma.creditAccount.findUnique({
        where: { userId },
      });
      if (racedAccount) return racedAccount;
      throw new CreditServiceError(
        "Mentor credits are temporarily unavailable.",
        503,
      );
    }
  }
}

export function getMonthlyPlanCreditAllocation(plan: SubscriptionPlan) {
  return planCreditAllocations[plan] ?? null;
}

function toBalanceSnapshot(account: {
  planBalance: unknown;
  topUpBalance: unknown;
}): CreditBalanceSnapshot {
  const planBalance = decimalToNumber(account.planBalance);
  const topUpBalance = decimalToNumber(account.topUpBalance);

  return {
    balance: roundCredits(Math.max(0, planBalance + topUpBalance)),
    creditRetailValueUsd: CREDIT_RETAIL_VALUE_USD,
    planBalance: roundCredits(Math.max(0, planBalance)),
    topUpBalance: roundCredits(Math.max(0, topUpBalance)),
  };
}

function decimalToNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCredits(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
