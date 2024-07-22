import type { TxParams } from "fuels";

export const ammContractAddress = '0xb942cd8440a4fe2e2e7548cfcb1d1547881cfe02db66a463b19e1e46ae56f0ca' as const;

export const DefaultTxParams: TxParams = {
  gasLimit: 1_000_000,
  maxFee: 1_000_000,
} as const;

export const DefaultDeadline = 1000000000 as const;
