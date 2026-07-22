import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminNav } from "@/components/admin/AdminNav";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { AdminAuthService } from "@/services/admin/admin-auth.service";
import { AdminBillingService } from "@/services/billing/admin-billing.service";
import { paymentsAvailable } from "@/services/billing/billing.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billing readiness | Mentor And I",
  description: "Internal subscription and entitlement monitoring.",
  robots: { follow: false, index: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function AdminBillingPage() {
  const access = await new AdminAuthService().resolveAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/login?next=%2Fadmin%2Fbilling");
  }
  if (access.status === "forbidden") {
    return <AdminAccessDenied email={access.email} />;
  }

  const subscriptions = await new AdminBillingService().getOverview();

  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-7xl">
        <div className="mb-8 space-y-4">
          <Text className="font-medium uppercase tracking-[0.18em]" variant="muted">Internal admin</Text>
          <Heading level={1}>Billing readiness</Heading>
          <Text>
            Subscription state and entitlement plans. During alpha, configured
            Stripe records are test-mode only. Customer identifiers are
            abbreviated and no billing secrets are displayed.
          </Text>
          <Text className="text-sm" variant="muted">
            Stripe test checkout is {paymentsAvailable() ? "enabled" : "not enabled"} in this environment.
          </Text>
          <AdminNav />
        </div>

        {subscriptions.length === 0 ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
            <Heading level={2}>No users yet</Heading>
            <Text className="mt-2">
              Billing readiness will show each app user with their effective
              alpha or paid subscription state.
            </Text>
          </section>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-600">
                <tr>
                  {['User', 'Plan', 'Status', 'Customer', 'Period end', 'Cancellation', 'Updated'].map((label) => (
                    <th className="px-4 py-3 font-semibold" key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {subscriptions.map((entry) => (
                  <tr key={`${entry.email}-${entry.createdAt}`}>
                    <td className="px-4 py-3 font-medium">{entry.email}</td>
                    <td className="px-4 py-3"><Badge>{formatEnum(entry.plan)}</Badge></td>
                    <td className="px-4 py-3">{formatEnum(entry.status)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{entry.customerPreview}</td>
                    <td className="px-4 py-3">{formatDate(entry.currentPeriodEnd)}</td>
                    <td className="px-4 py-3">{entry.cancelAtPeriodEnd ? 'Ends at period close' : 'Continuing'}</td>
                    <td className="px-4 py-3">{formatDate(entry.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </main>
  );
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

function formatEnum(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}
