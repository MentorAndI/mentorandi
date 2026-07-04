import type { MentorMemory } from "@/components/mentor/mentor-conversation.types";

export interface MentorMemoryPanelProps {
  isLoading: boolean;
  memories: MentorMemory[];
}

export function MentorMemoryPanel({
  isLoading,
  memories,
}: MentorMemoryPanelProps) {
  const visibleMemories = memories.slice(0, 5);

  return (
    <aside className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">
          What Marcus is learning
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Subtle notes that help the conversation become more personal over time.
        </p>
      </div>

      {isLoading && memories.length === 0 ? (
        <p
          aria-live="polite"
          className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500"
          role="status"
        >
          Loading memories...
        </p>
      ) : null}

      {!isLoading && memories.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm leading-6 text-zinc-500">
          Marcus will learn what matters to you over time.
        </p>
      ) : null}

      {visibleMemories.length > 0 ? (
        <div className="space-y-3">
          {visibleMemories.map((memory) => (
            <MemoryItem key={memory.id} memory={memory} />
          ))}
        </div>
      ) : null}
    </aside>
  );
}

interface MemoryItemProps {
  memory: MentorMemory;
}

function MemoryItem({ memory }: MemoryItemProps) {
  return (
    <article className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3">
      <p className="text-sm leading-6 text-zinc-700">
        {formatMemoryForUser(memory.content)}
      </p>
    </article>
  );
}

function formatMemoryForUser(content: string) {
  const normalizedContent = content.replace(/[.!?]+$/g, "").trim();

  return normalizedContent
    .replace(/^user\s+wants\s+/i, "You want ")
    .replace(/^user\s+needs\s+/i, "You need ")
    .replace(/^user\s+is\s+trying\s+to\s+/i, "You are trying to ")
    .replace(/^user\s+values\s+/i, "You value ")
    .replace(/^user\s+prefers\s+/i, "You prefer ")
    .replace(/^user\s+likes\s+/i, "You like ")
    .replace(/^user\s+doesn't\s+like\s+/i, "You do not like ")
    .replace(/^user\s+struggles\s+with\s+/i, "You have been struggling with ")
    .replace(/^user\s+struggles\s+/i, "You have been struggling with ");
}
