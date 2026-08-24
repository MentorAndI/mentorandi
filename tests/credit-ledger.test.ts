import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CreditTransactionType,
  SubscriptionPlan,
} from "@/lib/generated/prisma/client";
import { CreditService } from "@/services/credits/credit.service";

const userId = "00000000-0000-0000-0000-000000000010";

interface FakeAccountInput {
  lifetimeGranted: number;
  periodKey?: string | null;
  planBalance: number;
  topUpBalance: number;
}

interface FakeAccountUpdate {
  lifetimeGranted?: { increment: number };
  lifetimeUsed?: { increment: number };
  periodKey?: string | null;
  planBalance?: number;
  topUpBalance?: number;
}

interface FakeTransaction {
  accountId: string;
  amount: number;
  balanceAfter: number;
  idempotencyKey: string;
  type: CreditTransactionType;
  usageEventId?: string;
  userId: string;
  [key: string]: unknown;
}

class FakeCreditPrisma {
  account: {
    id: string;
    lifetimeGranted: number;
    lifetimeUsed: number;
    periodKey: string | null;
    planBalance: number;
    topUpBalance: number;
    userId: string;
  };
  transactions: FakeTransaction[] = [];

  constructor(input: FakeAccountInput) {
    this.account = {
      id: "00000000-0000-0000-0000-000000000012",
      lifetimeGranted: input.lifetimeGranted,
      lifetimeUsed: 0,
      periodKey: input.periodKey ?? null,
      planBalance: input.planBalance,
      topUpBalance: input.topUpBalance,
      userId,
    };
  }

  creditAccount = {
    create: async () => this.account,
    findUnique: async () => this.account,
    findUniqueOrThrow: async () => this.account,
    update: async ({ data }: { data: FakeAccountUpdate }) => {
      if (data.planBalance !== undefined) {
        this.account.planBalance = data.planBalance;
      }
      if (data.topUpBalance !== undefined) {
        this.account.topUpBalance = data.topUpBalance;
      }
      if (data.periodKey !== undefined) {
        this.account.periodKey = data.periodKey;
      }
      if (data.lifetimeGranted) {
        this.account.lifetimeGranted += data.lifetimeGranted.increment;
      }
      if (data.lifetimeUsed) {
        this.account.lifetimeUsed += data.lifetimeUsed.increment;
      }

      return this.account;
    },
    upsert: async () => this.account,
  };

  creditTransaction = {
    create: async ({ data }: { data: FakeTransaction }) => {
      if (
        this.transactions.some(
          (entry) => entry.idempotencyKey === data.idempotencyKey,
        )
      ) {
        throw new Error("Duplicate idempotency key");
      }

      this.transactions.push({ ...data });
      return data;
    },
    findUnique: async ({
      where,
    }: {
      where: { idempotencyKey?: string; usageEventId?: string };
    }) =>
      this.transactions.find(
        (entry) =>
          (where.idempotencyKey &&
            entry.idempotencyKey === where.idempotencyKey) ||
          (where.usageEventId && entry.usageEventId === where.usageEventId),
      ) ?? null,
  };

  $queryRaw = async () => [];

  async $transaction<T>(run: (transaction: FakeCreditPrisma) => Promise<T>) {
    return run(this);
  }
}

test("purchased top-up is idempotent and changes only top-up and lifetime balances", async () => {
  const prisma = new FakeCreditPrisma({
    lifetimeGranted: 800,
    planBalance: 800,
    topUpBalance: 0,
  });
  const service = new CreditService(prisma as never);

  const first = await service.applyPurchasedTopUp({
    checkoutSessionId: "cs_topup_once",
    credits: 1_000,
    userId,
  });
  const duplicate = await service.applyPurchasedTopUp({
    checkoutSessionId: "cs_topup_once",
    credits: 1_000,
    userId,
  });

  assert.equal(first.planBalance, 800);
  assert.equal(first.topUpBalance, 1_000);
  assert.equal(first.balance, 1_800);
  assert.deepEqual(duplicate, first);
  assert.equal(prisma.account.lifetimeGranted, 1_800);
  assert.equal(
    prisma.transactions.filter(
      (entry) => entry.type === CreditTransactionType.TOP_UP,
    ).length,
    1,
  );
  assert.deepEqual(
    prisma.transactions.find(
      (entry) => entry.type === CreditTransactionType.TOP_UP,
    ),
    {
      accountId: prisma.account.id,
      amount: 1_000,
      balanceAfter: 1_800,
      idempotencyKey: "topup:checkout:cs_topup_once",
      type: CreditTransactionType.TOP_UP,
      userId,
    },
  );
});

test("monthly plan credit reset leaves purchased top-up credits untouched", async () => {
  const prisma = new FakeCreditPrisma({
    lifetimeGranted: 1_800,
    periodKey: "previous-period",
    planBalance: 125,
    topUpBalance: 1_000,
  });
  const service = new CreditService(prisma as never);

  const nextPeriod = await service.applyPlanCredits({
    billingSubscriptionId: "sub_existing",
    periodEnd: new Date("2026-10-01T00:00:00.000Z"),
    plan: SubscriptionPlan.SINGLE,
    userId,
  });

  assert.equal(nextPeriod.planBalance, 800);
  assert.equal(nextPeriod.topUpBalance, 1_000);
  assert.equal(nextPeriod.balance, 1_800);
});

test("usage debits plan credits before purchased top-up credits", async () => {
  const prisma = new FakeCreditPrisma({
    lifetimeGranted: 10,
    planBalance: 0.2,
    topUpBalance: 1,
  });
  const service = new CreditService(prisma as never);

  const result = await service.debitUsageCredits({
    llmUsage: {
      inputTokens: 767,
      model: "gpt-5.4-mini-2026-03-17",
      outputTokens: 183,
      provider: "openai",
    },
    usageEventId: "00000000-0000-0000-0000-000000000011",
    userId,
  });

  assert.equal(result.creditsDebited, 0.28);
  assert.equal(result.planBalance, 0);
  assert.equal(result.topUpBalance, 0.92);
  assert.equal(result.balance, 0.92);
});
