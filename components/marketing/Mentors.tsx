import { Section } from "@/components/layout/Section";

interface MentorStyle {
  name: string;
  description: string;
}

export interface MentorsProps {
  styles?: MentorStyle[];
}

const defaultStyles: MentorStyle[] = [
  {
    name: "Life",
    description:
      "Personal direction, values, recurring patterns, difficult choices, and the next grounded step.",
  },
  {
    name: "ADHD",
    description:
      "Executive-function support for structure, task initiation, time blindness, and accountability.",
  },
  {
    name: "Relationship",
    description:
      "Communication, boundaries, repair, and conflict in real relationships—not a romantic AI companion.",
  },
  {
    name: "Stress / Burnout",
    description:
      "Boundaries, recovery, overload, and a more sustainable relationship with work and life.",
  },
  {
    name: "Parenting",
    description:
      "Calmer reflection on family dynamics, parental pressure, communication, and consistent responses.",
  },
  {
    name: "Health & Fitness",
    description:
      "Sustainable habits, motivation, routines, and realistic follow-through without medical diagnosis.",
  },
  {
    name: "Focus",
    description:
      "Non-diagnostic executive-function support for priorities, attention, distractions, and finishing.",
  },
  {
    name: "Confidence",
    description:
      "Support with self-doubt, imposter feelings, speaking up, and taking up space.",
  },
];

export function Mentors({ styles = defaultStyles }: MentorsProps) {
  return (
    <Section
      description="The alpha lineup centers on personal life, relationships, emotional load, executive function, and sustainable change."
      eyebrow="Alpha mentor lineup"
      id="mentors"
      title="Personal support for the parts of life that shape everything else."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {styles.map((style) => (
          <article
            className="rounded-lg border border-zinc-200 bg-white p-6"
            key={style.name}
          >
            <h3 className="text-lg font-semibold text-zinc-950">
              {style.name}
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {style.description}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
