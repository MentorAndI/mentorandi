import { getPrismaClient } from "@/lib/prisma";

interface BillingUserRow {
  billingCustomerId: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  currentPeriodEnd: Date | null;
  email: string | null;
  plan: string;
  status: string;
  updatedAt: Date;
}

export class AdminBillingRepository {
  private readonly prisma = getPrismaClient();

  listBillingUsers(limit: number) {
    return this.prisma.$queryRaw<BillingUserRow[]>`
      SELECT
        auth_user.email AS email,
        COALESCE(subscription.plan::text, 'ALPHA') AS plan,
        COALESCE(subscription.status::text, 'INACTIVE') AS status,
        subscription."billingCustomerId" AS "billingCustomerId",
        subscription."currentPeriodEnd" AS "currentPeriodEnd",
        COALESCE(subscription."cancelAtPeriodEnd", false) AS "cancelAtPeriodEnd",
        app_user."createdAt" AS "createdAt",
        COALESCE(subscription."updatedAt", app_user."updatedAt") AS "updatedAt"
      FROM public."User" AS app_user
      LEFT JOIN auth.users AS auth_user ON auth_user.id = app_user."authUserId"
      LEFT JOIN public."Subscription" AS subscription ON subscription."userId" = app_user.id
      ORDER BY COALESCE(subscription."updatedAt", app_user."updatedAt") DESC
      LIMIT ${limit}
    `;
  }
}
