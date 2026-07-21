import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminNav } from "@/components/admin/AdminNav";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { AdminAuthService } from "@/services/admin/admin-auth.service";
import { AdminUsageService } from "@/services/usage-monitoring/admin-usage.service";
import type { AdminUsageGroup } from "@/services/usage-monitoring/usage-monitoring.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alpha usage | MentorAndI",
  description: "Internal MentorAndI alpha usage and estimated cost monitoring.",
  robots: { follow: false, index: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function AdminUsagePage() {
  const access = await new AdminAuthService().resolveAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/login?next=%2Fadmin%2Fusage");
  }

  if (access.status === "forbidden") {
    return <AdminAccessDenied email={access.email} />;
  }

  const usage = await new AdminUsageService().getOverview();

  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-7xl">
        <div className="mb-8 space-y-4">
          <Text className="font-medium uppercase tracking-[0.18em]" variant="muted">
            Internal admin
          </Text>
          <Heading level={1}>Alpha usage</Heading>
          <Text>
            Persistent message, provider, model, mentor, and estimated cost
            monitoring. Signed in as{" "}
            <span className="font-medium text-zinc-900">{access.email}</span>.
          </Text>
          <Text className="text-sm" variant="muted">
            UTC periods. Costs use configured token-price estimates and are not
            billing-grade analytics. No message content is stored in usage events.
          </Text>
          <AdminNav />
        </div>

        <section aria-labelledby="periods-heading">
          <Heading className="sr-only" id="periods-heading" level={2}>
            Usage periods
          </Heading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Messages today"
              value={usage.periods.today.messageCount}
            />
            <MetricCard
              label="Messages / 7 days"
              value={usage.periods.last7Days.messageCount}
            />
            <MetricCard
              label="Messages / 30 days"
              value={usage.periods.last30Days.messageCount}
            />
            <MetricCard label="Blocked requests" value={usage.blockedCount} />
            <MetricCard
              label="Estimated cost today"
              value={formatCost(usage.periods.today.estimatedCostUsd)}
            />
            <MetricCard
              label="Estimated cost / 7 days"
              value={formatCost(usage.periods.last7Days.estimatedCostUsd)}
            />
            <MetricCard
              label="Estimated cost / 30 days"
              value={formatCost(usage.periods.last30Days.estimatedCostUsd)}
            />
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          <UsageGroup title="By provider, last 30 days" values={usage.byProvider} />
          <UsageGroup title="By model, last 30 days" values={usage.byModel} />
          <UsageGroup title="By mentor, last 30 days" values={usage.byMentor} />
        </div>

        <section className="mt-8 space-y-4">
          <Heading level={2}>Recent usage events</Heading>
          {usage.recentEvents.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <Text>No persistent usage events yet.</Text>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-600">
                  <tr>
                    {[
                      "Created (UTC)",
                      "Status",
                      "Mentor",
                      "Provider",
                      "Model",
                      "Route",
                      "Tokens",
                      "Estimated cost",
                      "Error code",
                    ].map((header) => (
                      <th className="px-4 py-3 font-semibold" key={header}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {usage.recentEvents.map((event, index) => (
                    <tr key={`${event.createdAt}-${index}`}>
                      <Cell>{dateFormatter.format(new Date(event.createdAt))}</Cell>
                      <Cell>
                        <Badge variant={statusVariant(event.status)}>
                          {formatLabel(event.status)}
                        </Badge>
                      </Cell>
                      <Cell>{event.mentor}</Cell>
                      <Cell>{event.provider}</Cell>
                      <Cell>{event.model}</Cell>
                      <Cell>{formatLabel(event.route)}</Cell>
                      <Cell>{event.totalTokens?.toLocaleString() ?? "—"}</Cell>
                      <Cell>
                        {event.estimatedCostUsd === null
                          ? "Not available"
                          : formatCost(event.estimatedCostUsd)}
                      </Cell>
                      <Cell>{event.errorCode ?? "—"}</Cell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <Text variant="muted">{label}</Text>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function UsageGroup({
  title,
  values,
}: {
  title: string;
  values: AdminUsageGroup[];
}) {
  return (
    <section className="mt-8 space-y-4">
      <Heading level={2}>{title}</Heading>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        {values.length === 0 ? (
          <Text variant="muted">No successful usage in this period.</Text>
        ) : (
          <dl className="space-y-3 text-sm">
            {values.map((entry) => (
              <div className="flex justify-between gap-4" key={entry.label}>
                <dt className="min-w-0 break-words text-zinc-700">{entry.label}</dt>
                <dd className="shrink-0 text-right font-medium text-zinc-900">
                  {entry.count} · {formatCost(entry.estimatedCostUsd)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-4 align-top text-zinc-700">{children}</td>;
}

function formatCost(value: number) {
  return `$${value.toFixed(6)}`;
}

function formatLabel(value: string) {
  if (value === "—") {
    return value;
  }

  return value
    .toLowerCase()
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusVariant(status: "SUCCESS" | "FAILURE" | "BLOCKED") {
  if (status === "SUCCESS") {
    return "success" as const;
  }

  if (status === "BLOCKED") {
    return "warning" as const;
  }

  return "muted" as const;
}
