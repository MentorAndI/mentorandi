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
    <header className="border-b border-zinc-200 pb-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <MentorPortrait
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl"
          name={name}
          portraitSrc={portraitSrc}
          priority
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">{role}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              {name}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
              {tagline}
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
