import { Section } from "@/components/layout/Section";

interface SolutionItem {
  title: string;
  description: string;
}

export interface SolutionProps {
  items?: SolutionItem[];
}

const defaultItems: SolutionItem[] = [
  {
    title: "Clearer thinking",
    description:
      "Turn scattered thoughts into structured reflection, practical options, and a calmer view of what matters next.",
  },
  {
    title: "Better decisions",
    description:
      "Explore tradeoffs with a mentor-like perspective before committing time, energy, or attention.",
  },
  {
    title: "Consistent follow-through",
    description:
      "Keep growth visible with simple prompts, recurring reflection, and a focus on the next useful action.",
  },
];

export function Solution({ items = defaultItems }: SolutionProps) {
  return (
    <Section
      className="bg-zinc-50"
      description="Mentor And I is designed as a calm, focused layer for reflection, direction, and personal momentum."
      eyebrow="The solution"
      id="solution"
      title="A personal mentor for the moments between meetings."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {items.map((item) => (
          <article
            className="rounded-lg border border-zinc-200 bg-white p-6"
            key={item.title}
          >
            <h3 className="text-lg font-semibold text-zinc-950">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
