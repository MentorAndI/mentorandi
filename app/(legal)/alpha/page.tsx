import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalPage,
  LegalSection,
} from "@/components/legal/LegalPage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Alpha tester guide | Mentor And I",
  description: "How external alpha testers can test Mentor And I safely.",
};

const linkClassName =
  "font-medium text-zinc-950 underline underline-offset-4";

export default async function AlphaTesterGuidePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  return (
    <LegalPage
      description="Your entry point for the external alpha: what Mentor And I does, how to begin, what to test, and where its boundaries are."
      title="Welcome to the Mentor And I private alpha"
    >
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-800">
          {isAuthenticated ? "You are signed in" : "External alpha testing"}
        </p>
        <p className="mt-2 text-base leading-7 text-sky-950">
          {isAuthenticated
            ? "Choose a specialized mentor, or begin with Marcus as your Life mentor."
            : "Create an account, verify your email, and continue to onboarding. Existing testers can log in below."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {isAuthenticated ? (
            <>
              <AlphaAction href="/mentors" label="Choose a mentor" primary />
              <AlphaAction href="/mentor?mentor=life" label="Start with Marcus" />
            </>
          ) : (
            <>
              <AlphaAction href="/signup" label="Create an account" primary />
              <AlphaAction href="/login" label="Log in" />
              <AlphaAction href="/demo" label="View the demo" />
            </>
          )}
        </div>
      </div>

      <LegalSection title="What Mentor And I is">
        <p>
          Mentor And I is a long-term AI mentoring product with specialized
          mentors for different situations. It keeps your account,
          mentor-specific conversation history, and relevant personal context
          so you can continue instead of starting over each time.
        </p>
      </LegalSection>

      <LegalSection title="What private alpha means">
        <p>
          This is an early test environment, not a finished public product.
          Features and responses may change, and you may encounter rough edges.
          New accounts require email verification before sign-in. Your honest
          feedback directly informs alpha improvements.
        </p>
        <p>
          Please use a real but low-risk personal issue when testing. Do not
          enter highly sensitive information during the alpha.
        </p>
      </LegalSection>

      <LegalSection title="What to test">
        <ol className="list-decimal space-y-2 pl-6">
          <li>Create an account.</li>
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

      <LegalSection title="What not to use it for">
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
            <Link className={linkClassName} href="/mentors">
              Mentors
            </Link>
          </li>
          <li>
            <Link className={linkClassName} href="/demo">
              Demo
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

function AlphaAction({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      className={
        primary
          ? "inline-flex h-10 items-center rounded-md bg-sky-900 px-4 text-sm font-semibold text-white hover:bg-sky-800"
          : "inline-flex h-10 items-center rounded-md border border-sky-300 bg-white px-4 text-sm font-semibold text-sky-950 hover:bg-sky-100"
      }
      href={href}
    >
      {label}
    </Link>
  );
}
