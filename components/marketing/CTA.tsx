import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export interface CTAProps {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function CTA({
  title = "Start with one honest conversation.",
  description = "Use Mentor And I as a focused space to think clearly, make a decision, and take the next step with more confidence.",
  ctaLabel = "Start Your Journey",
  ctaHref = "/start",
}: CTAProps) {
  return (
    <section id="cta" className="bg-white py-20 sm:py-24">
      <Container>
        <div className="rounded-lg border border-zinc-200 bg-zinc-950 px-6 py-12 text-center sm:px-10">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-300">
            {description}
          </p>
          <div className="mt-8">
            <Button
              className="bg-white text-zinc-950 hover:bg-zinc-100"
              href={ctaHref}
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
