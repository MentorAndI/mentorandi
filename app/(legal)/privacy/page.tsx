import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Privacy | Mentor And I",
  description: "Mentor And I Privacy Policy.",
};

export default function PrivacyPage() {
  redirect("https://mentorandi.com/privacy.html");
}
