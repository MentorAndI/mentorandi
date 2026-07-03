"use client";

import type { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export interface MentorMessageFormProps {
  disabled?: boolean;
  error?: string;
  isSending: boolean;
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function MentorMessageForm({
  disabled = false,
  error,
  isSending,
  message,
  onMessageChange,
  onSubmit,
}: MentorMessageFormProps) {
  return (
    <form className="space-y-4 border-t border-zinc-200 pt-5" onSubmit={onSubmit}>
      <Textarea
        error={error}
        id="mentor-message"
        label="What would be useful to think through?"
        onChange={(event) => onMessageChange(event.target.value)}
        placeholder="Share what is on your mind. A decision, a pattern, a goal, or just the thing you keep returning to."
        rows={5}
        textareaClassName="resize-y rounded-xl border-zinc-300 px-4 py-4 text-base leading-7"
        value={message}
      />

      <div className="flex justify-end">
        <Button
          className="min-w-32"
          disabled={disabled || isSending || !message.trim()}
          type="submit"
        >
          {isSending ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
