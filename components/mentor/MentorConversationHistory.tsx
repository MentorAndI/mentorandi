import type { MentorConversationMessage } from "@/components/mentor/mentor-conversation.types";
import { getConversationAuthorLabel } from "@/components/mentor/mentor-display-name";
import { cn } from "@/utils/cn";

export interface MentorConversationHistoryProps {
  isLoading: boolean;
  messages: MentorConversationMessage[];
  mentorName: string;
}

export function MentorConversationHistory({
  isLoading,
  messages,
  mentorName,
}: MentorConversationHistoryProps) {
  if (isLoading && messages.length === 0) {
    return (
      <p
        aria-live="polite"
        className="rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--band)] px-5 py-6 text-sm text-[var(--ink-muted)]"
        role="status"
      >
        Loading your conversation with {mentorName}...
      </p>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--band)] px-5 py-7">
        <p className="font-editorial text-2xl font-medium text-[var(--ink)]">
          Start with what matters today.
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
          Tell {mentorName} what you want help thinking through — a decision, a pattern, a goal, or something you keep returning to.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-4" aria-label="Conversation history">
      {messages.map((message) => (
        <li key={message.id}>
          <MentorConversationEntry message={message} mentorName={mentorName} />
        </li>
      ))}
    </ol>
  );
}

interface MentorConversationEntryProps {
  message: MentorConversationMessage;
  mentorName: string;
}

function MentorConversationEntry({
  message,
  mentorName,
}: MentorConversationEntryProps) {
  const isUser = message.role === "USER";

  return (
    <article
      className={cn(
        "rounded-[var(--r-lg)] px-4 py-4 sm:px-5",
        isUser
          ? "ml-auto max-w-[88%] border border-[var(--line)] bg-[var(--band)]"
          : "mr-auto max-w-[94%] border border-[var(--line)] bg-[var(--surface-raised)] shadow-[var(--shadow-sm)]",
      )}
    >
      <div className="mb-2.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[var(--ink)]">
          {getConversationAuthorLabel(message.role, mentorName)}
        </p>
        <time
          className="font-meta text-[0.68rem] text-[var(--ink-faint)]"
          dateTime={message.createdAt}
        >
          {formatMessageTime(message.createdAt)}
        </time>
      </div>
      <p className="whitespace-pre-wrap text-base leading-7 text-[var(--ink-muted)]">
        {message.content}
      </p>
    </article>
  );
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
