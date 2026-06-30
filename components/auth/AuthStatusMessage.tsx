import { cn } from "@/utils/cn";

export type AuthStatusMessageVariant = "error" | "success";

export interface AuthStatusMessageProps {
  children: string;
  id?: string;
  variant: AuthStatusMessageVariant;
}

const variantClasses: Record<AuthStatusMessageVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function AuthStatusMessage({
  children,
  id,
  variant,
}: AuthStatusMessageProps) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        variantClasses[variant],
      )}
      id={id}
      role={variant === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
