import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export interface HeroProps {
  headline?: string;
  subheadline?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}

export function Hero({
  headline = "Meet the mentor who never stops believing in you.",
  subheadline = "MentorAndI is a personal AI mentor designed to help you think clearly, make better decisions, stay accountable and continuously grow.",
  primaryCtaLabel = "Start Your Journey",
  primaryCtaHref = "/start",
  secondaryCtaLabel = "See How It Works",
  secondaryCtaHref = "#how-it-works",
}: HeroProps) {
  return (
    <section className="border-b border-zinc-200 bg-white py-24 sm:py-28 lg:py-32">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Premium AI mentoring platform
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
            {headline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
            {subheadline}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href={primaryCtaHref}>{primaryCtaLabel}</Button>
            <Button href={secondaryCtaHref} variant="secondary">
              {secondaryCtaLabel}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
