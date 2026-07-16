import type { Metadata } from "next";

import {
  LegalPage,
  LegalSection,
} from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy | MentorAndI",
  description: "How MentorAndI handles information during the alpha.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      description="A simple overview of how information is handled while MentorAndI is in early alpha."
      title="Privacy"
    >
      <LegalSection title="What we collect">
        <p>
          MentorAndI is an early alpha product. You create an account with an
          email address. Your conversations, goals, reflections, memories, and
          feedback may be stored so the mentor experience can work over time.
        </p>
      </LegalSection>

      <LegalSection title="How information is used">
        <p>
          We use this information to provide the product, remember useful
          context, resolve problems, and improve MentorAndI during the alpha.
          We do not sell your personal data.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>
          MentorAndI may use third-party providers to run the service. These may
          include Supabase for accounts and data storage, OpenAI or Anthropic
          for AI responses, and email services for account or support messages.
          Information is shared with providers only as needed to operate the
          product.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can use the account settings to export or delete mentor data where
          those controls are available. You can also request deletion through
          the contact page. Because this is an alpha, privacy processes and this
          page may change as the product develops.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
