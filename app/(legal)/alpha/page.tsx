import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalPage,
  LegalSection,
} from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Alpha tester guide | MentorAndI",
  description: "How invited testers can test MentorAndI safely.",
};

const linkClassName =
  "font-medium text-zinc-950 underline underline-offset-4";

export default function AlphaTesterGuidePage() {
  return (
    <LegalPage
      description="A short guide for invited testers: what to try, how to stay safe, and how to report what you find."
      title="Welcome to the MentorAndI private alpha"
    >
      <LegalSection title="Before you start">
        <p>
          MentorAndI is currently in private alpha. You need the invite code you
          received to create an account. Start on the{" "}
          <Link className={linkClassName} href="/signup">
            signup page
          </Link>
          , then verify your email before beginning your first mentor
          conversation.
        </p>
        <p>
          Please use a real but low-risk personal issue when testing. Do not
          enter highly sensitive information during the alpha.
        </p>
      </LegalSection>

      <LegalSection title="What to test">
        <ol className="list-decimal space-y-2 pl-6">
          <li>Create an account with your invite code.</li>
          <li>Verify your email.</li>
          <li>Start your first mentor conversation.</li>
          <li>Ask for help with a real but low-risk personal issue.</li>
          <li>Continue the conversation for 5–10 messages.</li>
          <li>Log out and back in.</li>
          <li>Check that your conversation history remains.</li>
          <li>Send feedback.</li>
        </ol>
        <p>
          If you are logged in, use the Feedback button inside /start or
          /mentor. Feedback about what felt useful, confusing, impersonal, or
          broken is especially helpful during alpha.
        </p>
      </LegalSection>

      <LegalSection title="Safety during alpha">
        <p>
          The mentor can support reflection and practical next steps, but it is
          not medical, legal, financial, or emergency advice. For urgent danger
          or a crisis, contact local emergency services or an appropriate human
          professional.
        </p>
      </LegalSection>

      <LegalSection title="Report a bug">
        <p>When something goes wrong, please report:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>the page you were on</li>
          <li>what you clicked or wrote</li>
          <li>what happened</li>
          <li>a screenshot, if possible</li>
        </ul>
      </LegalSection>

      <LegalSection title="Useful links">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li>
            <Link className={linkClassName} href="/signup">
              Sign up
            </Link>
          </li>
          <li>
            <Link className={linkClassName} href="/login">
              Log in
            </Link>
          </li>
          <li>
            <Link className={linkClassName} href="/privacy">
              Privacy
            </Link>
          </li>
          <li>
            <Link className={linkClassName} href="/terms">
              Terms
            </Link>
          </li>
          <li>
            <Link className={linkClassName} href="/contact">
              Contact
            </Link>
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
