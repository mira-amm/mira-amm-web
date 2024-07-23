import type { TxParams } from "fuels";

export const ammContractAddress = '0xb942cd8440a4fe2e2e7548cfcb1d1547881cfe02db66a463b19e1e46ae56f0ca' as const;

export const DefaultTxParams: TxParams = {
  gasLimit: 1_000_000,
  maxFee: 1_000_000,
} as const;

export const DefaultDeadline = 1000000000 as const;

export const DiscordLink = 'https://discord.gg/6pHdTY6rYq' as const;
export const XLink = 'https://x.com/MiraProtocol' as const;

export const EthAssetId = '0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07' as const;

export const TestnetUrl = 'https://testnet.fuel.network/v1/graphql' as const;
