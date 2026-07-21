import Link from "next/link";

export function AdminNav() {
  return (
    <nav aria-label="Admin navigation" className="flex flex-wrap gap-2">
      <AdminLink href="/admin">Overview</AdminLink>
      <AdminLink href="/admin/usage">Usage</AdminLink>
      <AdminLink href="/admin/feedback">Feedback</AdminLink>
      <AdminLink href="/admin/invites">Invites</AdminLink>
    </nav>
  );
}

function AdminLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-100"
      href={href}
    >
      {children}
    </Link>
  );
}
