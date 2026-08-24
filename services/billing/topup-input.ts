import {
  isTopUpPackKey,
  type TopUpPackKey,
} from "@/services/billing/topup.types";

export interface TopUpCheckoutInput {
  packKey: TopUpPackKey;
}

export function parseTopUpCheckoutInput(body: unknown): TopUpCheckoutInput | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);

  if (
    keys.length !== 1 ||
    keys[0] !== "packKey" ||
    !isTopUpPackKey(record.packKey)
  ) {
    return null;
  }

  return { packKey: record.packKey };
}
