"use client";

import { usePathname } from "next/navigation";
import { type FormEvent, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const successMessage = "Thanks — feedback received.";
const errorMessage = "Feedback could not be saved. Please try again.";

export function FeedbackButton() {
  const pathname = usePathname();
  const titleId = useId();
  const messageId = useId();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"error" | "success" | "">("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    void fetch("/api/me", { cache: "no-store" })
      .then((response) => {
        if (isCurrent) {
          setIsAuthenticated(response.ok);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsAuthenticated(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting]);

  if (!isAuthenticated) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/feedback", {
        body: JSON.stringify({
          category: form.get("category"),
          message: message.trim(),
          pagePath: pathname,
          rating: form.get("rating"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setMessage("");
      formElement.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        aria-expanded={isOpen}
        className="fixed bottom-4 right-4 z-30 shadow-lg sm:bottom-6 sm:right-6"
        onClick={() => {
          setIsOpen(true);
          setStatus("");
        }}
        size="sm"
        type="button"
        variant="secondary"
      >
        Feedback
      </Button>

      {isOpen ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end justify-center bg-zinc-950/40 p-3 sm:items-center sm:p-6"
          role="dialog"
        >
          <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950" id={titleId}>
                  Share feedback
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Tell us what is useful and what needs work.
                </p>
              </div>
              <button
                aria-label="Close feedback form"
                className="rounded-md px-2 py-1 text-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                disabled={isSubmitting}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2 text-sm font-medium text-zinc-900">
                <span>How useful is Mentor And I?</span>
                <select
                  className="block h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                  defaultValue="USEFUL"
                  name="rating"
                >
                  <option value="USEFUL">Useful</option>
                  <option value="NEUTRAL">Neutral</option>
                  <option value="NOT_USEFUL">Not useful</option>
                </select>
              </label>

              <label className="block space-y-2 text-sm font-medium text-zinc-900">
                <span>Category</span>
                <select
                  className="block h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                  defaultValue="MENTOR_QUALITY"
                  name="category"
                >
                  <option value="BUG">Bug</option>
                  <option value="CONFUSING">Confusing</option>
                  <option value="MENTOR_QUALITY">Mentor quality</option>
                  <option value="IDEA">Idea</option>
                  <option value="OTHER">Other</option>
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
                placeholder="What happened, or what would make Mentor And I better?"
                required
                value={message}
              />

              {status ? (
                <p
                  className={
                    status === "success" ? "text-emerald-700" : "text-red-600"
                  }
                  role={status === "error" ? "alert" : "status"}
                >
                  {status === "success" ? successMessage : errorMessage}
                </p>
              ) : null}

              <div className="flex justify-end gap-3">
                <Button
                  disabled={isSubmitting}
                  onClick={() => setIsOpen(false)}
                  type="button"
                  variant="ghost"
                >
                  Close
                </Button>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Sending..." : "Send feedback"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
