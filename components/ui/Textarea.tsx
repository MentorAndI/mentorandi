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
        <label className="block text-sm font-medium text-zinc-900" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <textarea
        aria-describedby={descriptionId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "block min-h-28 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950",
          "placeholder:text-zinc-400",
          "focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10",
          "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500",
          error && "border-red-500 focus:border-red-600 focus:ring-red-600/10",
          textareaClassName,
        )}
        id={id}
        {...props}
      />
      {error ? (
        <p className="text-sm text-red-600" id={`${id}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-zinc-500" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
