import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { Logo } from "@/components/ui/Logo";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <Container className="flex h-16 items-center">
          <Link aria-label="MentorAndI home" href="/">
            <Logo />
          </Link>
        </Container>
      </header>
      {children}
      <Footer />
    </div>
  );
}
