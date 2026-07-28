import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminNav } from "@/components/admin/AdminNav";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { AdminAuthService } from "@/services/admin/admin-auth.service";
import { AdminSpecialistObservabilityService } from "@/services/mentor-specialization/admin-specialist-observability.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Specialist runtime observability | Mentor And I",
  description: "Internal view of specialist context selected for mentor responses.",
  robots: { follow: false, index: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminSpecialistObservabilityPage() {
  const access = await new AdminAuthService().resolveAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/login?next=%2Fadmin%2Fspecialist-observability");
  }

  if (access.status === "forbidden") {
    return <AdminAccessDenied email={access.email} />;
  }

  const selections =
    await new AdminSpecialistObservabilityService().listRecentSelections();

  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-7xl">
        <div className="mb-8 space-y-4">
          <Text className="font-medium uppercase tracking-[0.18em]" variant="muted">
            Internal admin
          </Text>
          <Heading level={1}>Specialist runtime observability</Heading>
          <Text>
            Compact selection metadata for the 100 most recent successful mentor
            responses. No prompt or message text is stored here.
          </Text>
          <AdminNav />
        </div>

        {selections.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <Text>No specialist runtime selections recorded yet.</Text>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-600">
                <tr>
                  <TableHeader>Timestamp</TableHeader>
                  <TableHeader>Conversation</TableHeader>
                  <TableHeader>Mentor</TableHeader>
                  <TableHeader>Pack</TableHeader>
                  <TableHeader>Techniques</TableHeader>
                  <TableHeader>Knowledge cards</TableHeader>
                  <TableHeader>Safety rules</TableHeader>
                  <TableHeader>Budget</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {selections.map((selection) => (
                  <tr key={`${selection.conversationId}-${selection.createdAt}`}>
                    <TableCell className="whitespace-nowrap">
                      <time dateTime={selection.createdAt}>
                        {dateFormatter.format(new Date(selection.createdAt))}
                      </time>
                    </TableCell>
                    <TableCell className="max-w-56 break-all font-mono text-xs">
                      {selection.conversationId}
                    </TableCell>
                    <TableCell>{selection.mentor}</TableCell>
                    <TableCell>{selection.specialistPack}</TableCell>
                    <TableCell>
                      <SelectionList items={selection.techniques} />
                    </TableCell>
                    <TableCell>
                      <SelectionList items={selection.knowledgeCards} />
                    </TableCell>
                    <TableCell>
                      <SelectionList items={selection.safetyRules} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {selection.promptTokens === null
                        ? "—"
                        : `~${selection.promptTokens} tokens`}
                    </TableCell>
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

function TableHeader({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`align-top px-4 py-4 text-zinc-700 ${className}`}>{children}</td>;
}

function SelectionList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-zinc-400">None</span>;
  }

  return (
    <ul className="min-w-48 space-y-1">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
