import { cn } from "@/utils/cn";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  alt: string;
  className?: string;
  fallback: string;
  size?: AvatarSize;
  src?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function Avatar({
  alt,
  className,
  fallback,
  size = "md",
  src,
}: AvatarProps) {
  return (
    <span
      aria-label={alt}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 font-medium text-zinc-700",
        src && "bg-cover bg-center",
        sizeClasses[size],
        className,
      )}
      role={src ? "img" : undefined}
      style={src ? { backgroundImage: `url(${src})` } : undefined}
    >
      {src ? null : fallback}
    </span>
  );
}
