import { Button } from "@/components/ui/Button";

export interface MentorHeaderProps {
  isStartingNewConversation?: boolean;
  name: string;
  onNewConversation?: () => void;
  role: string;
  tagline: string;
}

export function MentorHeader({
  isStartingNewConversation = false,
  name,
  onNewConversation,
  role,
  tagline,
}: MentorHeaderProps) {
  return (
    <header className="border-b border-zinc-200 pb-6">
      <p className="text-sm font-medium text-zinc-500">{role}</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
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
    </header>
  );
}
