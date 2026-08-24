import { MentorPortrait } from "@/components/mentor/MentorPortrait";
import { Button } from "@/components/ui/Button";

export interface MentorHeaderProps {
  isStartingNewConversation?: boolean;
  name: string;
  onNewConversation?: () => void;
  portraitSrc: string | null;
  role: string;
  tagline: string;
}

export function MentorHeader({
  isStartingNewConversation = false,
  name,
  onNewConversation,
  portraitSrc,
  role,
  tagline,
}: MentorHeaderProps) {
  return (
    <header className="border-b border-[var(--line)] pb-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <MentorPortrait
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--r-xl)] shadow-[var(--shadow-sm)]"
          name={name}
          portraitSrc={portraitSrc}
          priority
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-meta text-[0.68rem] font-bold uppercase text-[var(--terra-text)]">
              {role}
            </p>
            <h1 className="font-editorial mt-1 text-4xl font-medium tracking-tight text-[var(--ink)] sm:text-5xl">
              {name}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--ink-muted)]">
              {tagline}
            </p>
            <p className="mt-3 max-w-2xl text-xs leading-5 text-[var(--ink-faint)]">
              {name} is an AI mentor, not a human or licensed therapist. Mentor And I provides mentoring and self-help support, not therapy, diagnosis, or emergency care.
            </p>
          </div>

          {onNewConversation ? (
            <Button
              disabled={isStartingNewConversation}
              onClick={onNewConversation}
              size="sm"
              type="button"
              variant="secondary"
            >
              {isStartingNewConversation ? "Starting..." : "New conversation"}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}