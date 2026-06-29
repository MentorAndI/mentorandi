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
        <p className="text-sm text-zinc-500">
          &copy; {year} {copyrightName}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
