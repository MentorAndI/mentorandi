import type { Metadata } from "next";

import {
  LegalPage,
  LegalSection,
} from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms | MentorAndI",
  description: "Basic terms for using the MentorAndI alpha.",
};

export default function TermsPage() {
  return (
    <LegalPage
      description="These are simple alpha terms, not final legal wording."
      title="Terms"
    >
      <LegalSection title="Alpha software">
        <p>
          MentorAndI is early alpha or beta software. Features, providers,
          limits, and availability may change. The service may contain errors,
          lose availability, or be discontinued.
        </p>
      </LegalSection>

      <LegalSection title="Mentoring, not professional advice">
        <p>
          MentorAndI is not medical, mental-health, legal, financial, or
          emergency advice. AI responses can be incomplete or wrong. You are
          responsible for checking important information and for the decisions
          you make.
        </p>
      </LegalSection>

      <LegalSection title="Emergencies and crisis situations">
        <p>
          Do not use MentorAndI for emergencies or crisis situations. If you or
          someone else may be in immediate danger, contact local emergency
          services or an appropriate crisis service now.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          Do not use the service for abuse, harassment, spam, illegal activity,
          attempts to damage the service, or access to another person&apos;s
          account or data. Access may be limited or removed when needed to
          protect users and the product.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
