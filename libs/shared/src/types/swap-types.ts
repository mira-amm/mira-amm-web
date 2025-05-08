export type CurrencyBoxMode = "buy" | "sell";
export type CurrencyBoxState = {
  assetId: string | null;
  amount: string;
};
export type SwapState = Record<CurrencyBoxMode, CurrencyBoxState>;
