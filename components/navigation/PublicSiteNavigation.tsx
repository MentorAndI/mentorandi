"use client";

import Link from "next/link";
import { useState } from "react";

const publicLinks = [
  { href: "https://mentorandi.com/index.html#mentors", label: "Mentors" },
  { href: "https://mentorandi.com/index.html#why", label: "Why a mentor" },
  { href: "https://mentorandi.com/index.html#how", label: "How it works" },
  { href: "https://mentorandi.com/index.html#insights", label: "Insights" },
  { href: "https://mentorandi.com/index.html#pricing", label: "Pricing" },
  { href: "https://mentorandi.com/index.html#faq", label: "FAQ" },
];

export function PublicSiteNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#201F1B1F] bg-[#F4EDE1]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-6 py-4 lg:px-12">
          <a
            aria-label="Mentor And I home"
            className="shrink-0"
            href="https://mentorandi.com/index.html"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Mentor And I"
              className="h-8 w-auto"
              height="32"
              src="https://mentorandi.com/images/MentorAndIlogo.png"
              width="161"
            />
          </a>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 lg:flex"
          >
            {publicLinks.map((link) => (
              <a
                className="text-sm text-[#6A6456] transition-colors hover:text-[#201F1B]"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link
              className="text-sm font-semibold text-[#201F1B] transition-colors hover:text-[#9E4A2C]"
              href="/login"
            >
              Log in
            </Link>
            <Link
              className="rounded-full bg-[#BC5B38] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(188,91,56,0.28)] transition hover:-translate-y-px hover:bg-[#9E4A2C]"
              href="/signup?plan=free"
            >
              Start free
            </Link>
          </div>

          <button
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-md p-2 text-[#201F1B] lg:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-[#F4EDE1]/[0.98] px-6 pb-8 pt-24 backdrop-blur-md lg:hidden">
          <nav aria-label="Mobile primary navigation">
            {publicLinks.map((link) => (
              <a
                className="block border-b border-[#201F1B1F] py-4 font-serif text-2xl text-[#201F1B]"
                href={link.href}
                key={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              className="block border-b border-[#201F1B1F] py-4 font-serif text-2xl text-[#201F1B]"
              href="/login"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Link
              className="mt-8 flex w-full items-center justify-center rounded-full bg-[#BC5B38] px-6 py-4 font-semibold text-white"
              href="/signup?plan=free"
              onClick={() => setOpen(false)}
            >
              Start free <span className="ml-2">→</span>
            </Link>
          </nav>
        </div>
      ) : null}
    </>
  );
}
