import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminNav } from "@/components/admin/AdminNav";
import { AlphaInviteManager } from "@/components/admin/AlphaInviteManager";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { AlphaInviteService } from "@/services/alpha-invite/alpha-invite.service";
import { AdminAuthService } from "@/services/admin/admin-auth.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alpha invites | Mentor And I",
  description: "Internal Mentor And I alpha invite management.",
  robots: { follow: false, index: false },
};

export default async function AdminInvitesPage() {
  const access = await new AdminAuthService().resolveAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/login?next=%2Fadmin%2Finvites");
  }

  if (access.status === "forbidden") {
    return <AdminAccessDenied email={access.email} />;
  }

  const invites = await new AlphaInviteService().listRecentInvites();

  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-7xl">
        <div className="mb-8 space-y-4">
          <Text className="font-medium uppercase tracking-[0.18em]" variant="muted">
            Internal admin
          </Text>
          <Heading level={1}>Alpha invites</Heading>
          <Text>
            Create, track, and revoke private-alpha access. Signed in as{" "}
            <span className="font-medium text-zinc-900">{access.email}</span>.
          </Text>
          <AdminNav />
        </div>
        <AlphaInviteManager initialInvites={invites} />
      </Container>
    </main>
  );
}
