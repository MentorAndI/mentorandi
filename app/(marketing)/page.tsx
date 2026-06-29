import { CTA } from "@/components/marketing/CTA";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Mentors } from "@/components/marketing/Mentors";
import { Problem } from "@/components/marketing/Problem";
import { Solution } from "@/components/marketing/Solution";

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <Mentors />
      <HowItWorks />
      <CTA />
    </>
  );
}
