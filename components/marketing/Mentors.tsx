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
    name: "Strategic",
    description:
      "For decisions that need perspective, prioritization, and a sharper understanding of consequences.",
  },
  {
    name: "Reflective",
    description:
      "For moments that call for patience, self-awareness, and a more honest read of what is happening.",
  },
  {
    name: "Accountable",
    description:
      "For keeping commitments visible and translating intentions into steady, practical movement.",
  },
];

export function Mentors({ styles = defaultStyles }: MentorsProps) {
  return (
    <Section
      description="Different moments call for different kinds of support. The experience should feel thoughtful, direct, and grounded."
      eyebrow="Mentoring modes"
      id="mentors"
      title="Guidance that adapts to the conversation."
    >
      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {styles.map((style) => (
          <article className="grid gap-3 p-6 md:grid-cols-3" key={style.name}>
            <h3 className="text-lg font-semibold text-zinc-950">
              {style.name}
            </h3>
            <p className="text-sm leading-6 text-zinc-600 md:col-span-2">
              {style.description}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
