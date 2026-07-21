import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminNav } from "@/components/admin/AdminNav";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { AdminAuthService } from "@/services/admin/admin-auth.service";
import { AdminOverviewService } from "@/services/admin/admin-overview.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alpha admin | MentorAndI",
  description: "Internal MentorAndI alpha overview.",
  robots: {
    follow: false,
    index: false,
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminOverviewPage() {
  const access = await new AdminAuthService().resolveAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/login?next=%2Fadmin");
  }

  if (access.status === "forbidden") {
    return <AdminAccessDenied email={access.email} />;
  }

  const overview = await new AdminOverviewService().getOverview();

  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-7xl">
        <div className="mb-8 space-y-4">
          <Text className="font-medium uppercase tracking-[0.18em]" variant="muted">
            Internal admin
          </Text>
          <Heading level={1}>Alpha overview</Heading>
          <Text>
            Early-user activity and feedback. Signed in as{" "}
            <span className="font-medium text-zinc-900">{access.email}</span>.
          </Text>
          <AdminNav />
        </div>

        <section aria-labelledby="totals-heading">
          <Heading className="sr-only" id="totals-heading" level={2}>
            Totals
          </Heading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Users" value={overview.totals.users} />
            <MetricCard
              label="Conversations"
              value={overview.totals.conversations}
            />
            <MetricCard label="Messages" value={overview.totals.messages} />
            <MetricCard label="Feedback" value={overview.totals.feedback} />
          </div>
        </section>

        <AdminSection title="Recent users">
          <DataTable
            emptyMessage="No users yet."
            headers={["Email", "Created", "Last activity", "Conversations", "Messages", "Feedback"]}
            rows={overview.recentUsers.map((user) => [
              user.email,
              formatDate(user.createdAt),
              formatDate(user.lastActivityAt),
              String(user.conversationCount),
              String(user.messageCount),
              String(user.feedbackCount),
            ])}
          />
        </AdminSection>

        <AdminSection title="Recent conversations">
          <DataTable
            emptyMessage="No conversations yet."
            headers={["User", "Mentor", "Created", "Last activity", "Messages"]}
            rows={overview.recentConversations.map((conversation) => [
              conversation.email,
              conversation.mentorName,
              formatDate(conversation.createdAt),
              formatDate(conversation.updatedAt),
              String(conversation.messageCount),
            ])}
          />
        </AdminSection>

        <div className="grid gap-8 lg:grid-cols-2">
          <AdminSection title="Feedback summary">
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryList
                items={overview.feedbackSummary.byRating}
                title="By rating"
              />
              <SummaryList
                items={overview.feedbackSummary.byCategory}
                title="By category"
              />
            </div>
            <DataTable
              emptyMessage="No feedback yet."
              headers={["Created", "Rating", "Category", "Page"]}
              rows={overview.feedbackSummary.recent.map((entry) => [
                formatDate(entry.createdAt),
                formatLabel(entry.rating),
                formatLabel(entry.category),
                entry.pagePath ?? "—",
              ])}
            />
          </AdminSection>

        </div>
      </Container>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <Text variant="muted">{label}</Text>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function AdminSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="mt-8 space-y-4">
      <Heading level={2}>{title}</Heading>
      {children}
    </section>
  );
}

function DataTable({
  emptyMessage,
  headers,
  rows,
}: {
  emptyMessage: string;
  headers: string[];
  rows: string[][];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <Text>{emptyMessage}</Text>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
        <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-600">
          <tr>
            {headers.map((header) => (
              <th className="px-4 py-3 font-semibold" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td
                  className="max-w-72 whitespace-nowrap px-4 py-4 align-top text-zinc-700"
                  key={`${headers[cellIndex]}-${cellIndex}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryList({
  items,
  title,
}: {
  items: Array<{ count: number; label: string }>;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="font-semibold">{title}</p>
      {items.length === 0 ? (
        <Text className="mt-2" variant="muted">
          No feedback yet.
        </Text>
      ) : (
        <dl className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <div className="flex justify-between gap-4" key={item.label}>
              <dt className="text-zinc-600">{formatLabel(item.label)}</dt>
              <dd className="font-medium text-zinc-900">{item.count}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
