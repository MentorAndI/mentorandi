import { Section } from "@/components/layout/Section";

interface Step {
  title: string;
  description: string;
}

export interface HowItWorksProps {
  steps?: Step[];
}

const defaultSteps: Step[] = [
  {
    title: "Bring the context",
    description:
      "Start with the situation, goal, decision, or pattern you want to understand more clearly.",
  },
  {
    title: "Think it through",
    description:
      "Use structured prompts to examine options, surface assumptions, and identify what deserves attention.",
  },
  {
    title: "Leave with direction",
    description:
      "Translate the conversation into a next step that is specific enough to act on and simple enough to revisit.",
  },
];

export function HowItWorks({ steps = defaultSteps }: HowItWorksProps) {
  return (
    <Section
      className="bg-zinc-50"
      description="A simple flow keeps the product focused on reflection, decision-making, and forward motion."
      eyebrow="How it works"
      id="how-it-works"
      title="A quieter way to make progress."
    >
      <ol className="grid gap-5 md:grid-cols-3">
        {steps.map((step, index) => (
          <li
            className="rounded-lg border border-zinc-200 bg-white p-6"
            key={step.title}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-sm font-medium text-zinc-700">
              {index + 1}
            </span>
            <h3 className="mt-5 text-lg font-semibold text-zinc-950">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
