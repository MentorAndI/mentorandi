import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

export const metadata: Metadata = {
  title: "Articles | Mentor And I",
  description:
    "Practical articles from Mentor And I on focus, confidence, relationships, health, stress and everyday decisions.",
};

const topics = [
  {
    title: "Confidence & communication",
    description:
      "Practical guidance on presence, conversation, social confidence and clear communication.",
  },
  {
    title: "Focus & ADHD",
    description:
      "Useful techniques for attention, task initiation, overwhelm and sustainable routines.",
  },
  {
    title: "Relationships & stress",
    description:
      "Clear frameworks for boundaries, difficult conversations, pressure and recovery.",
  },
];

export default function ArticlesPage() {
  return (
    <section className="bg-[var(--app-bg)] py-14 text-[var(--ink)] sm:py-20">
      <Container className="max-w-6xl">
        <div className="max-w-2xl">
          <Badge variant="muted">Articles</Badge>
          <Heading className="mt-5 font-editorial" level={1}>
            Practical guidance you can use
          </Heading>
          <Text className="mt-4 text-lg leading-8 text-[var(--ink-muted)]">
            Mentor And I articles will collect practical guidance from the same
            areas covered by our mentors. New articles are being prepared.
          </Text>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {topics.map((topic) => (
            <Card className="p-6" key={topic.title} variant="bordered">
              <p className="font-meta text-[0.68rem] text-[var(--terra-text)]">
                COMING SOON
              </p>
              <Heading className="mt-3 text-2xl" level={2}>
                {topic.title}
              </Heading>
              <Text className="mt-3 leading-7 text-[var(--ink-muted)]">
                {topic.description}
              </Text>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
