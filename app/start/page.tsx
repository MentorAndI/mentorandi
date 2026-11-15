import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentor | Mentor And I",
  description: "Continue to your Mentor And I workspace.",
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string }>;
}) {
  const { mentor } = await searchParams;
  const mentorSlug = mentor?.trim() || "life";

  redirect(`/mentor?mentor=${encodeURIComponent(mentorSlug)}`);
}
