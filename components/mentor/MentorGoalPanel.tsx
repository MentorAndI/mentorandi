import type { MentorGoal } from "@/components/mentor/mentor-conversation.types";

export interface MentorGoalPanelProps {
  goals: MentorGoal[];
  isLoading: boolean;
}

export function MentorGoalPanel({ goals, isLoading }: MentorGoalPanelProps) {
  const activeGoals = goals
    .filter((goal) => goal.status === "ACTIVE")
    .slice(0, 5);

  return (
    <aside className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">
          What Marcus is helping you work toward
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Active goals that can guide the conversation.
        </p>
      </div>

      {isLoading && activeGoals.length === 0 ? (
        <p
          aria-live="polite"
          className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500"
          role="status"
        >
          Loading goals...
        </p>
      ) : null}

      {!isLoading && activeGoals.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm leading-6 text-zinc-500">
          Goals will appear here when you tell Marcus what you want to work
          toward.
        </p>
      ) : null}

      {activeGoals.length > 0 ? (
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <GoalItem goal={goal} key={goal.id} />
          ))}
        </div>
      ) : null}
    </aside>
  );
}

interface GoalItemProps {
  goal: MentorGoal;
}

function GoalItem({ goal }: GoalItemProps) {
  return (
    <article className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-6 text-zinc-950">
          {goal.title}
        </h3>
        <span className="shrink-0 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-500">
          {formatGoalStatus(goal.status)}
        </span>
      </div>

      {goal.description ? (
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {goal.description}
        </p>
      ) : null}
    </article>
  );
}

function formatGoalStatus(status: string) {
  return status.toLowerCase().replace(/^\w/, (character) =>
    character.toUpperCase(),
  );
}
