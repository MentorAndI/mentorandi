import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { AdminAuthService } from "@/services/admin/admin-auth.service";
import { FeedbackService } from "@/services/feedback/feedback.service";
import type {
  FeedbackCategoryInput,
  FeedbackRatingInput,
} from "@/services/feedback/feedback.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alpha feedback | MentorAndI",
  description: "Internal MentorAndI alpha feedback review.",
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
    return <NotAllowed email={access.email} />;
  }

  const feedback = await new FeedbackService().getRecentFeedbackForAdmin();

  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-7xl">
        <div className="mb-8 space-y-3">
          <Text className="font-medium uppercase tracking-[0.18em]" variant="muted">
            Internal admin
          </Text>
          <Heading level={1}>Alpha feedback</Heading>
          <Text>
            The 100 most recent submissions, newest first. Signed in as{" "}
            <span className="font-medium text-zinc-900">{access.email}</span>.
          </Text>
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
                  <TableHeader>Message</TableHeader>
                  <TableHeader>Page</TableHeader>
                  <TableHeader>User</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {feedback.map((entry, index) => (
                  <tr key={`${entry.userId}-${entry.createdAt}-${index}`}>
                    <TableCell className="whitespace-nowrap text-zinc-600">
                      <time dateTime={entry.createdAt}>
                        {dateFormatter.format(new Date(entry.createdAt))}
                      </time>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRatingVariant(entry.rating)}>
                        {formatLabel(entry.rating)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatLabel(entry.category)}
                    </TableCell>
                    <TableCell className="min-w-80 max-w-xl whitespace-pre-wrap text-zinc-800">
                      {entry.message}
                    </TableCell>
                    <TableCell className="max-w-64 break-all text-zinc-600">
                      {entry.pagePath ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-64 break-all font-mono text-xs text-zinc-600">
                      {entry.userId}
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

function NotAllowed({ email }: { email: string | null }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-red-700">
          403 — Not allowed
        </p>
        <Heading level={1}>Admin access required</Heading>
        <Text className="mt-4">
          {email
            ? `${email} is authenticated but is not allowed to review alpha feedback.`
            : "Your authenticated account has no email available for admin authorization."}
        </Text>
      </div>
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

function formatLabel(value: FeedbackCategoryInput | FeedbackRatingInput) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRatingVariant(rating: FeedbackRatingInput) {
  if (rating === "USEFUL") {
    return "success" as const;
  }

  if (rating === "NOT_USEFUL") {
    return "warning" as const;
  }

  return "muted" as const;
}
