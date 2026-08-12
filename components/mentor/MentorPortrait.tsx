import Image from "next/image";

interface MentorPortraitProps {
  className: string;
  imageClassName?: string;
  name: string;
  portraitSrc: string | null;
  priority?: boolean;
}

export function MentorPortrait({
  className,
  imageClassName,
  name,
  portraitSrc,
  priority = false,
}: MentorPortraitProps) {
  if (portraitSrc) {
    return (
      <div className={className}>
        <Image
          alt={`${name} mentor portrait`}
          className={imageClassName ?? "h-full w-full object-cover object-top"}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 50vw, 100vw"
          src={portraitSrc}
        />
      </div>
    );
  }

  return (
    <div
      aria-label={`${name} mentor portrait placeholder`}
      className={`${className} flex items-center justify-center bg-gradient-to-br from-stone-100 to-sky-100 text-sky-950`}
      role="img"
    >
      <span className="text-3xl font-semibold tracking-tight" aria-hidden="true">
        {getInitials(name)}
      </span>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
