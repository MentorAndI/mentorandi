import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export interface HeaderNavItem {
  label: string;
  href: string;
}

export interface HeaderProps {
  navItems?: HeaderNavItem[];
}

const defaultNavItems: HeaderNavItem[] = [
  { label: "Problem", href: "#problem" },
  { label: "Solution", href: "#solution" },
  { label: "Mentors", href: "#mentors" },
  { label: "How it Works", href: "#how-it-works" },
];

export function Header({ navItems = defaultNavItems }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link aria-label="MentorAndI home" href="/">
          <Logo />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/login" size="sm" variant="ghost">
            Login
          </Button>
          <Button href="/start" size="sm" variant="secondary">
            Start
          </Button>
        </div>
      </Container>
    </header>
  );
}
