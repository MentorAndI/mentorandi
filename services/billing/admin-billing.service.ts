import { AdminBillingRepository } from "@/services/billing/admin-billing.repository";

export class AdminBillingService {
  constructor(private readonly repository = new AdminBillingRepository()) {}

  async getOverview() {
    const subscriptions = await this.repository.listBillingUsers(100);

    return subscriptions.map((entry) => ({
      cancelAtPeriodEnd: entry.cancelAtPeriodEnd,
      createdAt: entry.createdAt.toISOString(),
      currentPeriodEnd: entry.currentPeriodEnd?.toISOString() ?? null,
      customerPreview: previewIdentifier(entry.billingCustomerId),
      email: entry.email ?? "Email unavailable",
      plan: entry.plan,
      status: entry.status,
      updatedAt: entry.updatedAt.toISOString(),
    }));
  }
}

function previewIdentifier(value: string | null) {
  if (!value) return "Not linked";
  if (value.length <= 10) return `${value.slice(0, 4)}…`;
  return `${value.slice(0, 7)}…${value.slice(-4)}`;
}
