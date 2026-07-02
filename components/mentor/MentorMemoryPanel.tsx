import type { MentorMemory } from "@/components/mentor/mentor-conversation.types";

export interface MentorMemoryPanelProps {
  isLoading: boolean;
  memories: MentorMemory[];
}

export function MentorMemoryPanel({
  isLoading,
  memories,
}: MentorMemoryPanelProps) {
  return (
    <aside className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">Memory</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          What Marcus is beginning to understand.
        </p>
      </div>

      {isLoading && memories.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
          Loading memories...
        </p>
      ) : null}

      {!isLoading && memories.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm leading-6 text-zinc-500">
          Memories will appear here as the mentoring relationship develops.
        </p>
      ) : null}

      {memories.length > 0 ? (
        <div className="space-y-3">
          {memories.slice(0, 6).map((memory) => (
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
    <article className="rounded-md border border-zinc-200 bg-white px-3 py-3">
      <p className="text-xs font-semibold uppercase text-zinc-500">
        {memory.category}
      </p>
      <h3 className="mt-1 text-sm font-medium leading-6 text-zinc-950">
        {memory.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{memory.content}</p>
    </article>
  );
}
