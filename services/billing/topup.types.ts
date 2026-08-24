export const topUpPackKeys = [
  "topup_1000",
  "topup_2500",
  "topup_5000",
] as const;

export type TopUpPackKey = (typeof topUpPackKeys)[number];

export interface TopUpPackDisplay {
  credits: number;
  displayPrice: number;
  key: TopUpPackKey;
}

export function isTopUpPackKey(value: unknown): value is TopUpPackKey {
  return (
    typeof value === "string" &&
    topUpPackKeys.includes(value as TopUpPackKey)
  );
}
