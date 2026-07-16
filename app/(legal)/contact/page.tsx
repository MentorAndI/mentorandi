import type { Metadata } from "next";

import {
  LegalPage,
  LegalSection,
} from "@/components/legal/LegalPage";
import { getAlphaSupportEmail } from "@/services/support/support-config";

export const metadata: Metadata = {
  title: "Contact | MentorAndI",
  description: "Contact MentorAndI alpha support.",
};

export default function ContactPage() {
  const supportEmail = getAlphaSupportEmail();

  return (
    <LegalPage
      description="Questions, account requests, and alpha feedback for MentorAndI."
      title="Contact"
    >
      <LegalSection title="MentorAndI alpha support">
        {supportEmail ? (
          <p>
            Email{" "}
            <a
              className="font-medium text-zinc-950 underline underline-offset-4"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
            .
          </p>
        ) : (
          <p>Contact support through the person who invited you.</p>
        )}
      </LegalSection>

      <LegalSection title="Deletion requests">
        <p>
          If you want your account or stored information deleted, say that
          clearly in your message and use the email address connected to your
          MentorAndI account.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
