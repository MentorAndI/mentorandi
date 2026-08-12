"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

export interface FeedbackButtonProps {
  mentorSlug?: string | null;
}

export function FeedbackButton({ mentorSlug }: FeedbackButtonProps) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    void fetch("/api/me", { cache: "no-store" })
      .then((response) => {
        if (isCurrent) {
          setIsAuthenticated(response.ok);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsAuthenticated(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const query = new URLSearchParams({ context: pathname });

  if (mentorSlug) {
    query.set("mentor", mentorSlug);
  }

  return (
    <Button
      className="fixed bottom-4 right-4 z-30 shadow-lg sm:bottom-6 sm:right-6"
      href={`/feedback?${query.toString()}`}
      size="sm"
      variant="secondary"
    >
      Feedback
    </Button>
  );
}
