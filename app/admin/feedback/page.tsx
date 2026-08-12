import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminNav } from "@/components/admin/AdminNav";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { AdminAuthService } from "@/services/admin/admin-auth.service";
import { FeedbackService } from "@/services/feedback/feedback.service";
import type { LegacyFeedbackRating } from "@/services/feedback/feedback.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alpha feedback | Mentor And I",
  description: "Internal Mentor And I alpha feedback review.",
  robots: {
    follow: false,
    index: false,
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminFeedbackPage() {
  const access = await new AdminAuthService().resolveAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/login?next=%2Fadmin%2Ffeedback");
  }

  if (access.status === "forbidden") {
    return <AdminAccessDenied email={access.email} />;
  }

  const feedback = await new FeedbackService().getRecentFeedbackForAdmin();

  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-7xl">
        <div className="mb-8 space-y-4">
          <Text className="font-medium uppercase tracking-[0.18em]" variant="muted">
            Internal admin
          </Text>
          <Heading level={1}>Alpha feedback</Heading>
          <Text>
            The 100 most recent submissions, newest first. Signed in as{" "}
            <span className="font-medium text-zinc-900">{access.email}</span>.
          </Text>
          <AdminNav />
        </div>

        {feedback.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <Text>No feedback yet.</Text>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-600">
                <tr>
                  <TableHeader>Created</TableHeader>
                  <TableHeader>Rating</TableHeader>
                  <TableHeader>Category</TableHeader>
                  <TableHeader>Mentor</TableHeader>
                  <TableHeader>Message</TableHeader>
                  <TableHeader>Page</TableHeader>
                  <TableHeader>User</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {feedback.map((entry, index) => (
                  <tr key={`${entry.userEmail}-${entry.createdAt}-${index}`}>
                    <TableCell className="whitespace-nowrap text-zinc-600">
                      <time dateTime={entry.createdAt}>
                        {dateFormatter.format(new Date(entry.createdAt))}
                      </time>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRatingVariant(entry)}>
                        {formatRating(entry)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatLabel(entry.category)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600">
                      {entry.mentorSlug ? formatLabel(entry.mentorSlug) : "—"}
                    </TableCell>
                    <TableCell className="min-w-80 max-w-xl whitespace-pre-wrap text-zinc-800">
                      {entry.message}
                    </TableCell>
                    <TableCell className="max-w-64 break-all text-zinc-600">
                      {entry.pagePath ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-64 break-all text-zinc-600">
                      {entry.userEmail}
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
  return <td className={`align-top px-4 py-4 ${className}`}>{children}</td>;
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRating(entry: {
  rating: LegacyFeedbackRating;
  ratingScore: number | null;
}) {
  return entry.ratingScore === null
    ? "Not rated"
    : `${entry.ratingScore}/5`;
}

function getRatingVariant(entry: {
  rating: LegacyFeedbackRating;
  ratingScore: number | null;
}) {
  if (entry.ratingScore !== null) {
    if (entry.ratingScore >= 4) return "success" as const;
    if (entry.ratingScore <= 2) return "warning" as const;
    return "muted" as const;
  }

  if (entry.rating === "USEFUL") {
    return "success" as const;
  }

  if (entry.rating === "NOT_USEFUL") {
    return "warning" as const;
  }

  return "muted" as const;
}
