import type { TxParams } from "fuels";

export const DexContractAddress = '0x88ec1f70ba59c9c8ab448ee49184b53e6dbd59d900dbac5a89225af6a037fb22' as const;
export const FaucetContractAddress = '0xba9647979df1d19f1d7e17c006243549ebce2c6e474585f59df4e7aaf309fc81' as const;

export const DefaultTxParams: TxParams = {
  gasLimit: 1_000_000,
  maxFee: 1_000_000,
} as const;

export const DefaultDeadline = 1000000000 as const;

export const DiscordLink = 'https://discord.gg/6pHdTY6rYq' as const;
export const XLink = 'https://x.com/MiraProtocol' as const;

export const TestnetUrl = 'https://testnet.fuel.network/v1/graphql' as const;
