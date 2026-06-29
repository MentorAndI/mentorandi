import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export type DividerOrientation = "horizontal" | "vertical";

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: DividerOrientation;
}

export function Divider({
  className,
  orientation = "horizontal",
  ...props
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <hr
        aria-orientation="vertical"
        className={cn("h-full w-px border-0 bg-zinc-200", className)}
        {...props}
      />
    );
  }

  return (
    <hr className={cn("h-px w-full border-0 bg-zinc-200", className)} {...props} />
  );
}
