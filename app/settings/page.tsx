import type { Metadata } from "next";

import { AccountDataControls } from "@/components/account/AccountDataControls";
import { AccountNavigation } from "@/components/auth/AccountNavigation";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

export const metadata: Metadata = {
  title: "Settings | Mentor And I",
  description: "Manage Mentor And I account data controls.",
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 py-10 text-zinc-950">
      <Container className="max-w-5xl">
        <AccountNavigation
          links={[{ href: "/mentor", label: "Back to Mentor" }]}
        />
        <div className="mb-8 max-w-2xl space-y-3">
          <Heading level={1}>Account data</Heading>
          <Text>
            Export your Mentor And I data or delete your mentor data.
          </Text>
        </div>

        <AccountDataControls />
      </Container>
    </main>
  );
}
