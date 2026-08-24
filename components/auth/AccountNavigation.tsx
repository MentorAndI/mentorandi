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
  links: AccountNavigationLink[];
}

export function AccountNavigation({ links }: AccountNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  return (
    <header className="mb-8 border-b border-[var(--line)] pb-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            aria-label="Mentor And I mentor workspace"
            className="font-serif text-xl font-medium tracking-[-0.02em] text-[var(--ink)]"
            href="/mentor"
          >
            Mentor <span className="text-[var(--terra-text)]">And I</span>
          </Link>

          <nav aria-label="App navigation" className="flex flex-wrap gap-1">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/mentor" && pathname.startsWith(`${link.href}/`));

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={[
                    "rounded-[var(--r-pill)] px-3 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-[var(--band)] text-[var(--ink)]"
                      : "text-[var(--ink-muted)] hover:bg-[var(--band)] hover:text-[var(--ink)]",
                  ].join(" ")}
                  href={link.href}
                  key={`${link.href}-${link.label}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <Button
            disabled={isSigningOut}
            onClick={handleSignOut}
            size="sm"
            type="button"
            variant="ghost"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </Button>

          {errorMessage ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
