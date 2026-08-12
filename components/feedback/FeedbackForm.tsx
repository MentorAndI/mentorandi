"use client";

import { type FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface MentorOption {
  label: string;
  value: string;
}

export interface FeedbackFormProps {
  initialMentorSlug?: string;
  initialPagePath: string;
  mentorOptions: MentorOption[];
}

const successMessage = "Thanks — your feedback was saved.";
const errorMessage = "Feedback could not be saved. Please try again.";

export function FeedbackForm({
  initialMentorSlug,
  initialPagePath,
  mentorOptions,
}: FeedbackFormProps) {
  const messageId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"error" | "success" | "">("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ratingValue = form.get("rating");

    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/feedback", {
        body: JSON.stringify({
          category: form.get("category"),
          message: message.trim(),
          mentorSlug: form.get("mentorSlug"),
          pagePath: form.get("pagePath"),
          rating: ratingValue ? Number(ratingValue) : undefined,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      formElement.reset();
      setMessage("");
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block space-y-2 text-sm font-medium text-zinc-900">
        <span>Category</span>
        <select
          className="block h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
          defaultValue="OTHER"
          name="category"
        >
          <option value="BUG">Bug</option>
          <option value="CONFUSING">Confusing</option>
          <option value="MENTOR_QUALITY">Mentor quality</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="PRICING">Pricing or billing</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <label className="block space-y-2 text-sm font-medium text-zinc-900">
        <span>Rating (optional)</span>
        <select
          className="block h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
          defaultValue=""
          name="rating"
        >
          <option value="">No rating</option>
          <option value="5">5 — Excellent</option>
          <option value="4">4 — Good</option>
          <option value="3">3 — Okay</option>
          <option value="2">2 — Needs work</option>
          <option value="1">1 — Poor</option>
        </select>
      </label>

      <Textarea
        hint={`${message.length}/2000 characters`}
        id={messageId}
        label="Message"
        maxLength={2000}
        onChange={(event) => {
          setMessage(event.target.value);
          if (status) setStatus("");
        }}
        placeholder="What happened, what felt confusing, or what would make the experience better?"
        required
        value={message}
      />

      <label className="block space-y-2 text-sm font-medium text-zinc-900">
        <span>Page or context (optional)</span>
        <input
          className="block h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
          defaultValue={initialPagePath}
          maxLength={500}
          name="pagePath"
          placeholder="/mentor"
          type="text"
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-zinc-900">
        <span>Mentor (optional)</span>
        <select
          className="block h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
          defaultValue={initialMentorSlug ?? ""}
          name="mentorSlug"
        >
          <option value="">Not mentor-specific</option>
          {mentorOptions.map((mentor) => (
            <option key={mentor.value} value={mentor.value}>
              {mentor.label}
            </option>
          ))}
        </select>
      </label>

      {status ? (
        <p
          className={status === "success" ? "text-emerald-700" : "text-red-600"}
          role={status === "error" ? "alert" : "status"}
        >
          {status === "success" ? successMessage : errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button href="/mentor" variant="ghost">
          Back to mentor
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
