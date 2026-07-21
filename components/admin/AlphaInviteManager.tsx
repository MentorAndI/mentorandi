"use client";

import { type FormEvent, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { AlphaInviteAdminDto } from "@/services/alpha-invite/alpha-invite.types";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function AlphaInviteManager({
  initialInvites,
}: {
  initialInvites: AlphaInviteAdminDto[];
}) {
  const [invites, setInvites] = useState(initialInvites);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setGeneratedCode(null);
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const expiry = String(formData.get("expiresAt") ?? "").trim();

    try {
      const response = await fetch("/api/admin/invites", {
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          expiresAt: expiry ? new Date(expiry).toISOString() : undefined,
          maxUses: Number(formData.get("maxUses") ?? 1),
          note: String(formData.get("note") ?? ""),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as {
        code?: string;
        error?: string;
        invite?: AlphaInviteAdminDto;
      } | null;

      if (!response.ok || !body?.code || !body.invite) {
        setError(body?.error ?? "Unable to create an invite.");
        return;
      }

      setGeneratedCode(body.code);
      setInvites((current) => [body.invite!, ...current]);
      form.reset();
    } catch {
      setError("Unable to create an invite right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revokeInvite(inviteId: string) {
    setError("");

    try {
      const response = await fetch(
        `/api/admin/invites/${encodeURIComponent(inviteId)}/revoke`,
        { method: "POST" },
      );
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Unable to revoke the invite.");
        return;
      }

      setInvites((current) =>
        current.map((invite) =>
          invite.id === inviteId
            ? { ...invite, revokedAt: new Date().toISOString(), status: "revoked" }
            : invite,
        ),
      );
    } catch {
      setError("Unable to revoke the invite right now.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Create invite</h2>
        <p className="mt-2 text-sm text-zinc-600">
          The full code is shown once. Only its secure hash and a short preview
          are stored.
        </p>

        {generatedCode ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <p className="font-semibold">Copy this invite code now</p>
            <code className="mt-2 block break-all rounded-md bg-white p-3 text-sm">
              {generatedCode}
            </code>
            <Button
              className="mt-3"
              onClick={() => navigator.clipboard.writeText(generatedCode)}
              size="sm"
              type="button"
              variant="secondary"
            >
              Copy code
            </Button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={createInvite}>
          <Input
            id="invite-email"
            label="Restricted email (optional)"
            name="email"
            placeholder="tester@example.com"
            type="email"
          />
          <Input
            id="invite-expiry"
            label="Expires (optional)"
            name="expiresAt"
            type="datetime-local"
          />
          <Input
            defaultValue="1"
            id="invite-max-uses"
            label="Maximum uses"
            max={100}
            min={1}
            name="maxUses"
            required
            type="number"
          />
          <Textarea
            id="invite-note"
            label="Internal note (optional)"
            maxLength={500}
            name="note"
            textareaClassName="min-h-24"
          />
          <Button className="md:col-span-2 md:w-fit" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating…" : "Create invite"}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recent invites</h2>
        {invites.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-zinc-600">
            No database-backed invites yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-600">
                <tr>
                  {[
                    "Code",
                    "Status",
                    "Email",
                    "Uses",
                    "Created",
                    "Expires",
                    "Note",
                    "Action",
                  ].map((header) => (
                    <th className="px-4 py-3 font-semibold" key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <Cell><code>{invite.codePreview}</code></Cell>
                    <Cell><Badge variant={statusVariant(invite.status)}>{invite.status}</Badge></Cell>
                    <Cell>{invite.email ?? "Any invited email"}</Cell>
                    <Cell>{invite.useCount} / {invite.maxUses}</Cell>
                    <Cell>{formatDate(invite.createdAt)}</Cell>
                    <Cell>{invite.expiresAt ? formatDate(invite.expiresAt) : "No expiry"}</Cell>
                    <Cell>{invite.note ?? "—"}</Cell>
                    <Cell>
                      {invite.status === "active" ? (
                        <Button
                          onClick={() => revokeInvite(invite.id)}
                          size="sm"
                          type="button"
                          variant="destructive"
                        >
                          Revoke
                        </Button>
                      ) : "—"}
                    </Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="max-w-72 px-4 py-4 align-top text-zinc-700">{children}</td>;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function statusVariant(status: AlphaInviteAdminDto["status"]) {
  if (status === "active") return "success" as const;
  if (status === "expired") return "warning" as const;
  return "muted" as const;
}
