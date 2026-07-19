import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

export function AdminAccessDenied({ email }: { email: string | null }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-red-700">
          403 — Not allowed
        </p>
        <Heading level={1}>Admin access required</Heading>
        <Text className="mt-4">
          {email
            ? `${email} is authenticated but is not included in the alpha admin allowlist.`
            : "Your authenticated account has no email available for admin authorization."}
        </Text>
      </div>
    </main>
  );
}
