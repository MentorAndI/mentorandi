import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Terms | Mentor And I",
  description: "Mentor And I Terms of Use.",
};

export default function TermsPage() {
  redirect("https://mentorandi.com/terms.html");
}
