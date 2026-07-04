"use client";

import { useRouter } from "next/navigation";
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
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Account navigation" className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Button
            href={link.href}
            key={`${link.href}-${link.label}`}
            size="sm"
            variant="ghost"
          >
            {link.label}
          </Button>
        ))}
      </nav>

      <div className="flex flex-col gap-2 sm:items-end">
        <Button
          disabled={isSigningOut}
          onClick={handleSignOut}
          size="sm"
          type="button"
          variant="secondary"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>

        {errorMessage ? (
          <p className="text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
