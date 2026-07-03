import type { MentorConversationSummary } from "@/components/mentor/mentor-conversation.types";
import { cn } from "@/utils/cn";

export interface MentorConversationListProps {
  activeConversationId: string;
  conversations: MentorConversationSummary[];
  isLoading: boolean;
  onSelectConversation: (conversationId: string) => void;
}

export function MentorConversationList({
  activeConversationId,
  conversations,
  isLoading,
  onSelectConversation,
}: MentorConversationListProps) {
  return (
    <aside className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">
          Recent conversations
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Continue where you left off.
        </p>
      </div>

      {isLoading && conversations.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
          Loading conversations...
        </p>
      ) : null}

      {!isLoading && conversations.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm leading-6 text-zinc-500">
          Your conversations with Marcus will appear here.
        </p>
      ) : null}

      {conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;

            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  "w-full rounded-md border px-3 py-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2",
                  isActive
                    ? "border-zinc-950 bg-white"
                    : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white",
                )}
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                type="button"
              >
                <span className="block text-sm font-medium text-zinc-950">
                  {formatConversationTime(
                    conversation.latestMessageAt ?? conversation.updatedAt,
                  )}
                </span>
                <span className="mt-1 line-clamp-2 block text-sm leading-6 text-zinc-500">
                  {conversation.latestMessagePreview ?? "New conversation"}
                </span>
                <span className="mt-2 block text-xs font-medium text-zinc-500">
                  {isActive ? "Current" : "Continue"}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}

function formatConversationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}
