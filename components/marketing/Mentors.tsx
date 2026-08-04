import Image from "next/image";
import Link from "next/link";

import { Section } from "@/components/layout/Section";
import { activeMentorProfiles } from "@/services/mentor-catalog/mentor-catalog";

export function Mentors() {
  return (
    <Section
      description="The alpha lineup centers on personal life, relationships, emotional load, executive function, and sustainable change."
      eyebrow="Alpha mentor lineup"
      id="mentors"
      title="Personal support for the parts of life that shape everything else."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {activeMentorProfiles.map((mentor) => (
          <article
            className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm"
            key={mentor.slug}
          >
            <Image
              alt={`${mentor.personaName}, ${mentor.name}`}
              className="aspect-[4/3] w-full rounded-xl object-cover object-top"
              height={600}
              src={mentor.portraitSrc}
              width={800}
            />
            <h3 className="mt-5 text-xl font-semibold text-zinc-950">
              {mentor.personaName}
            </h3>
            <p className="mt-1 text-sm font-semibold text-sky-900">
              {mentor.name}
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              {mentor.shortDescription}
            </p>
            <ul
              aria-label={`${mentor.cardName} focus areas`}
              className="mt-5 flex flex-wrap gap-2"
            >
              {mentor.cardTags.map((tag) => (
                <li
                  className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900"
                  key={tag}
                >
                  {tag}
                </li>
              ))}
            </ul>
            {mentor.cardBoundary ? (
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                {mentor.cardBoundary}
              </p>
            ) : null}
            <Link
              className="mt-6 inline-flex h-10 items-center justify-center self-start rounded-lg border border-sky-200 px-4 text-sm font-semibold text-sky-950 transition hover:bg-sky-50"
              href={`/mentors/${mentor.slug}`}
            >
              Meet {mentor.personaName}
            </Link>
          </article>
        ))}
      </div>
    </Section>
  );
}
