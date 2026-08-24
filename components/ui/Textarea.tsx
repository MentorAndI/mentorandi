import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "id"> {
  error?: string;
  hint?: string;
  id: string;
  textareaClassName?: string;
  label?: string;
  wrapperClassName?: string;
}

export function Textarea({
  error,
  hint,
  id,
  label,
  textareaClassName,
  wrapperClassName,
  ...props
}: TextareaProps) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      {label ? (
        <label className="block text-sm font-semibold text-[var(--ink)]" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <textarea
        aria-describedby={descriptionId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "block min-h-28 w-full rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--ink)] shadow-[var(--shadow-sm)]",
          "placeholder:text-[var(--ink-faint)]",
          "focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20",
          "disabled:cursor-not-allowed disabled:bg-[var(--band)] disabled:text-[var(--ink-faint)]",
          error && "border-[var(--danger)] focus:border-[var(--danger)]",
          textareaClassName,
        )}
        id={id}
        {...props}
      />
      {error ? (
        <p className="text-sm text-[var(--danger)]" id={`${id}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-[var(--ink-faint)]" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
