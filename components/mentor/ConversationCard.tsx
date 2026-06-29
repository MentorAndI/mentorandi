import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export interface ConversationCardProps {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}

export function ConversationCard({
  children,
  className,
  labelledBy = "first-conversation-heading",
}: ConversationCardProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(
        "w-full max-w-[700px] rounded-2xl border border-zinc-200 bg-white px-6 py-10 shadow-sm",
        "sm:px-10 sm:py-12 lg:px-12",
        className,
      )}
    >
      {children}
    </section>
  );
}
