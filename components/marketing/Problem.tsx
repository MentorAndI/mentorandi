import { Section } from "@/components/layout/Section";

interface ProblemPoint {
  title: string;
  description: string;
}

export interface ProblemProps {
  points?: ProblemPoint[];
}

const defaultPoints: ProblemPoint[] = [
  {
    title: "Reflection is easy to postpone",
    description:
      "Busy schedules leave little room to pause, sort through decisions, and notice the patterns shaping progress.",
  },
  {
    title: "Accountability fades between milestones",
    description:
      "Goals can lose momentum when there is no consistent place to revisit commitments and adjust the next step.",
  },
  {
    title: "Growth needs continuity",
    description:
      "Meaningful development depends on context, follow-through, and a steady rhythm of thoughtful challenge.",
  },
];

export function Problem({ points = defaultPoints }: ProblemProps) {
  return (
    <Section
      description="Professional growth often depends less on more information and more on having a reliable space to think with clarity."
      eyebrow="The problem"
      id="problem"
      title="Ambition needs a steady conversation."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {points.map((point) => (
          <article
            className="rounded-lg border border-zinc-200 bg-white p-6"
            key={point.title}
          >
            <h3 className="text-lg font-semibold text-zinc-950">
              {point.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {point.description}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
