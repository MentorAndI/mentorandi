import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalPage,
  LegalSection,
} from "@/components/legal/LegalPage";

const alphaSupportEmail = "support@mentorandi.com";

export const metadata: Metadata = {
  title: "Contact | Mentor And I",
  description: "Contact Mentor And I alpha support.",
};

export default function ContactPage() {
  return (
    <LegalPage
      description="Questions, account requests, and alpha feedback for Mentor And I."
      title="Contact"
    >
      <LegalSection title="Mentor And I alpha support">
        <p>
          For alpha support, contact:{" "}
          <a
            className="font-medium text-zinc-950 underline underline-offset-4"
            href={`mailto:${alphaSupportEmail}`}
          >
            {alphaSupportEmail}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Share feedback">
        <p>
          If you are logged in, use the Feedback button inside{" "}
          <Link
            className="font-medium text-zinc-950 underline underline-offset-4"
            href="/start"
          >
            /start
          </Link>{" "}
          or{" "}
          <Link
            className="font-medium text-zinc-950 underline underline-offset-4"
            href="/mentor"
          >
            /mentor
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Report a bug">
        <p>When reporting a bug, please include:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>the page you were on</li>
          <li>what you clicked or wrote</li>
          <li>what happened</li>
          <li>a screenshot, if possible</li>
        </ul>
      </LegalSection>

      <LegalSection title="Deletion requests">
        <p>
          If you want your account or stored information deleted, say that
          clearly in your message and use the email address connected to your
          Mentor And I account.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
