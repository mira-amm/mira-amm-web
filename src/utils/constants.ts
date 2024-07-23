import type { TxParams } from "fuels";

export const DexContractAddress = '0xb942cd8440a4fe2e2e7548cfcb1d1547881cfe02db66a463b19e1e46ae56f0ca' as const;
export const FaucetContractAddress = '0xba9647979df1d19f1d7e17c006243549ebce2c6e474585f59df4e7aaf309fc81' as const;

export const DefaultTxParams: TxParams = {
  gasLimit: 1_000_000,
  maxFee: 1_000_000,
} as const;

export const DefaultDeadline = 1000000000 as const;

export const DiscordLink = 'https://discord.gg/6pHdTY6rYq' as const;
export const XLink = 'https://x.com/MiraProtocol' as const;

export const EthAssetId = '0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07' as const;
export const FaucetAssetId = '0x616f0285ec15818029a3ceab52899261b5761ff0400140e5a58f320e0c461be2' as const;

export const TestnetUrl = 'https://testnet.fuel.network/v1/graphql' as const;
