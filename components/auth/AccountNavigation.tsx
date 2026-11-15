"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { signOutCurrentUser } from "@/services/auth/client";

export interface AccountNavigationLink {
  href: string;
  label: string;
}

export interface AccountNavigationProps {
  links?: AccountNavigationLink[];
}

export const defaultAccountNavigationLinks: AccountNavigationLink[] = [
  { href: "/mentor", label: "My Mentor" },
  { href: "/mentors", label: "More Mentors" },
  { href: "/articles", label: "Articles" },
  { href: "/contact", label: "Contact" },
  { href: "/pricing", label: "Upgrade" },
  { href: "/credits", label: "Credits" },
  { href: "/settings", label: "Settings" },
];

export function AccountNavigation({
  links = defaultAccountNavigationLinks,
}: AccountNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const primaryLinks = links.filter((link) =>
    ["/mentor", "/mentors", "/articles", "/contact"].includes(link.href),
  );
  const utilityLinks = links.filter((link) =>
    ["/credits", "/settings"].includes(link.href),
  );
  const upgradeLink = links.find((link) => link.href === "/pricing");

  async function handleSignOut() {
    setErrorMessage("");
    setIsSigningOut(true);

    try {
      await signOutCurrentUser();
      router.replace("/login");
      router.refresh();
    } catch {
      setErrorMessage("Unable to sign out right now.");
    } finally {
      setIsSigningOut(false);
    }
  }

  function linkClass(href: string) {
    const active =
      pathname === href ||
      (href !== "/mentor" && pathname.startsWith(`${href}/`));

    return [
      "text-sm font-semibold transition-colors",
      active
        ? "text-[var(--ink)]"
        : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
    ].join(" ");
  }

  return (
    <header className="mb-8 border-b border-[var(--line)] pb-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            aria-label="Mentor And I mentor workspace"
            className="shrink-0 font-serif text-xl font-medium tracking-[-0.02em] text-[var(--ink)]"
            href="/mentor"
          >
            Mentor <span className="text-[var(--terra-text)]">And I</span>
          </Link>

          <div className="flex items-center gap-2">
            {upgradeLink ? (
              <Button href={upgradeLink.href} size="sm">
                {upgradeLink.label}
              </Button>
            ) : null}
            <Button
              disabled={isSigningOut}
              onClick={handleSignOut}
              size="sm"
              type="button"
              variant="ghost"
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-3 lg:flex-row lg:items-center lg:justify-between">
          <nav
            aria-label="Main app navigation"
            className="flex gap-5 overflow-x-auto pb-1"
          >
            {primaryLinks.map((link) => (
              <Link className={linkClass(link.href)} href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <nav
            aria-label="Account navigation"
            className="flex gap-5 overflow-x-auto pb-1"
          >
            {utilityLinks.map((link) => (
              <Link className={linkClass(link.href)} href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {errorMessage ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </header>
  );
}
