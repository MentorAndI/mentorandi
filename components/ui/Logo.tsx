export interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center text-lg font-semibold tracking-tight text-zinc-950 ${className}`}
    >
      Mentor And I
    </span>
  );
}
