import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

interface PlaceholderCardProps {
  title: string;
  description: string;
}

function PlaceholderCard({ title, description }: PlaceholderCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-zinc-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <>
      <section className="py-20 sm:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Premium AI mentoring platform
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              Hero
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600">
              Placeholder content for the MentorAndI landing page hero section.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="#cta">Primary CTA</Button>
              <Button href="#how-it-works" variant="secondary">
                Learn More
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Section
        description="Placeholder content for the value proposition section."
        id="why"
        title="Why MentorAndI"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <PlaceholderCard
            description="Placeholder supporting point for this section."
            title="Placeholder"
          />
          <PlaceholderCard
            description="Placeholder supporting point for this section."
            title="Placeholder"
          />
          <PlaceholderCard
            description="Placeholder supporting point for this section."
            title="Placeholder"
          />
        </div>
      </Section>

      <Section
        className="bg-zinc-50"
        description="Placeholder content for the process section."
        id="how-it-works"
        title="How it Works"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <PlaceholderCard
            description="Placeholder step description."
            title="Step One"
          />
          <PlaceholderCard
            description="Placeholder step description."
            title="Step Two"
          />
          <PlaceholderCard
            description="Placeholder step description."
            title="Step Three"
          />
        </div>
      </Section>

      <Section
        description="Placeholder content for customer or user proof."
        id="testimonials"
        title="Testimonials"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <PlaceholderCard
            description="Placeholder testimonial content."
            title="Testimonial"
          />
          <PlaceholderCard
            description="Placeholder testimonial content."
            title="Testimonial"
          />
        </div>
      </Section>

      <Section
        className="bg-zinc-50"
        description="Placeholder content for common questions."
        id="faq"
        title="FAQ"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <PlaceholderCard
            description="Placeholder answer content."
            title="Question"
          />
          <PlaceholderCard
            description="Placeholder answer content."
            title="Question"
          />
        </div>
      </Section>

      <Section
        description="Placeholder content for the final conversion section."
        id="cta"
        title="CTA"
      >
        <Button href="/">Placeholder CTA</Button>
      </Section>
    </>
  );
}
