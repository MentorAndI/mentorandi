import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminNav } from "@/components/admin/AdminNav";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { AdminAuthService } from "@/services/admin/admin-auth.service";
import { AdminSpecialistLibraryService } from "@/services/mentor-specialization/admin-specialist-library.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentor specialist library | Mentor And I",
  description: "Read-only view of curated mentor specialist runtime content.",
  robots: { follow: false, index: false },
};

export default async function AdminMentorSpecializationPage() {
  const access = await new AdminAuthService().resolveAdminAccess();
  if (access.status === "unauthenticated") {
    redirect("/login?next=%2Fadmin%2Fmentor-specialization");
  }
  if (access.status === "forbidden") {
    return <AdminAccessDenied email={access.email} />;
  }

  const packs = await new AdminSpecialistLibraryService().listPacks();
  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-7xl">
        <div className="mb-8 space-y-4">
          <Text className="font-medium uppercase tracking-[0.18em]" variant="muted">
            Internal admin
          </Text>
          <Heading level={1}>Mentor specialist library</Heading>
          <Text>
            Read-only runtime content imported from the repository. Signed in as{" "}
            <span className="font-medium text-zinc-900">{access.email}</span>.
          </Text>
          <AdminNav />
        </div>

        <div className="space-y-6">
          {packs.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <Text>No specialist packs have been imported.</Text>
            </div>
          ) : (
            packs.map((pack) => (
              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm" key={`${pack.slug}-${pack.version}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <Heading level={2}>{pack.displayName}</Heading>
                  <Badge variant={pack.status === "ACTIVE" ? "success" : "muted"}>
                    {pack.status.toLowerCase()}
                  </Badge>
                  <Text variant="muted">{pack.version}</Text>
                </div>
                <Text className="mt-2">{pack.description}</Text>
                <Text className="mt-2" variant="muted">
                  {pack.techniques.length} techniques · {pack.knowledgeCards.length} cards ·{" "}
                  {pack.safetyRules.length} safety rules · {pack.sources.length} sources ·{" "}
                  {pack.evalScenarioCount} eval scenarios
                </Text>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <LibraryList title="Techniques" items={pack.techniques.map((item) => `${item.title} — ${item.summary}`)} />
                  <LibraryList title="Knowledge cards" items={pack.knowledgeCards.map((item) => `${item.title} — ${item.summary}`)} />
                  <LibraryList title="Safety rules" items={pack.safetyRules.map((item) => `[${item.severity.toLowerCase()}] ${item.rule}`)} />
                  <LibraryList title="Sources" items={pack.sources.map((item) => `${item.publisher}: ${item.title}`)} />
                </div>
              </section>
            ))
          )}
        </div>
      </Container>
    </main>
  );
}

function LibraryList({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h3 className="font-semibold text-zinc-900">{title}</h3>
      <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto text-sm text-zinc-700">
        {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}
