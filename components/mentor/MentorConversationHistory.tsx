import type { MentorConversationMessage } from "@/components/mentor/mentor-conversation.types";

export interface MentorConversationHistoryProps {
  isLoading: boolean;
  messages: MentorConversationMessage[];
}

export function MentorConversationHistory({
  isLoading,
  messages,
}: MentorConversationHistoryProps) {
  if (isLoading && messages.length === 0) {
    return (
      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
        Loading your conversation with Marcus...
      </p>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-6">
        <p className="text-sm leading-6 text-zinc-600">
          This is a quiet place to think clearly. Share what is on your mind,
          and Marcus will help you find a useful next step.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-5" aria-label="Conversation history">
      {messages.map((message) => (
        <li key={message.id}>
          <MentorConversationEntry message={message} />
        </li>
      ))}
    </ol>
  );
}

interface MentorConversationEntryProps {
  message: MentorConversationMessage;
}

function MentorConversationEntry({ message }: MentorConversationEntryProps) {
  const isUser = message.role === "USER";

  return (
    <article className="rounded-lg border border-zinc-200 bg-white px-4 py-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-zinc-950">
          {isUser ? "You" : "Marcus"}
        </p>
        <time className="text-xs text-zinc-500" dateTime={message.createdAt}>
          {formatMessageTime(message.createdAt)}
        </time>
      </div>
      <p className="whitespace-pre-wrap text-base leading-7 text-zinc-700">
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
