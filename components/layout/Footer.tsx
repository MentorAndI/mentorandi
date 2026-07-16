import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/ui/Logo";

export interface FooterProps {
  copyrightName?: string;
}

export function Footer({ copyrightName = "MentorAndI" }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-white py-8">
      <Container className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <div className="flex flex-col gap-3 text-sm text-zinc-500 sm:items-end">
          <nav aria-label="Legal and support" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link className="transition hover:text-zinc-950" href="/privacy">
              Privacy
            </Link>
            <Link className="transition hover:text-zinc-950" href="/terms">
              Terms
            </Link>
            <Link className="transition hover:text-zinc-950" href="/contact">
              Contact
            </Link>
          </nav>
          <p>
            &copy; {year} {copyrightName}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
