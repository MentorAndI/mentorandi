import type { InputHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id"> {
  error?: string;
  hint?: string;
  id: string;
  inputClassName?: string;
  label?: string;
  wrapperClassName?: string;
}

export function Input({
  error,
  hint,
  id,
  inputClassName,
  label,
  wrapperClassName,
  ...props
}: InputProps) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      {label ? (
        <label className="block text-sm font-semibold text-[var(--ink)]" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        aria-describedby={descriptionId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "block h-11 w-full rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--ink)] shadow-[var(--shadow-sm)]",
          "placeholder:text-[var(--ink-faint)]",
          "focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ring)_18%,transparent)]",
          "disabled:cursor-not-allowed disabled:bg-[var(--band)] disabled:text-[var(--ink-faint)]",
          error && "border-[var(--danger)] focus:border-[var(--danger)]",
          inputClassName,
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
