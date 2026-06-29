import { cn } from "@/utils/cn";

export interface CharacterCounterProps {
  className?: string;
  current: number;
  max: number;
}

export function CharacterCounter({
  className,
  current,
  max,
}: CharacterCounterProps) {
  return (
    <p
      aria-live="polite"
      className={cn("text-sm tabular-nums text-zinc-500", className)}
    >
      {current} / {max}
    </p>
  );
}
