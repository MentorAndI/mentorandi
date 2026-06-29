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
        <label className="block text-sm font-medium text-zinc-900" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        aria-describedby={descriptionId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "block h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950",
          "placeholder:text-zinc-400",
          "focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10",
          "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500",
          error && "border-red-500 focus:border-red-600 focus:ring-red-600/10",
          inputClassName,
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
