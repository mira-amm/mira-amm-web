import type { TxParams } from "fuels";

export const DexContractAddress = '0x88ec1f70ba59c9c8ab448ee49184b53e6dbd59d900dbac5a89225af6a037fb22' as const;
export const FaucetContractAddress = '0xa1ada1dcab2524dc7f030bbff36c14ede24efd8becffac022a4c501e977e13c6' as const;

export const DefaultTxParams: TxParams = {
  gasLimit: 1_000_000,
  maxFee: 1_000_000,
} as const;

export const DefaultDeadline = 1000000000 as const;

export const DiscordLink = 'https://discord.gg/6pHdTY6rYq' as const;
export const XLink = 'https://x.com/MiraProtocol' as const;

export const TestnetUrl = 'https://testnet.fuel.network/v1/graphql' as const;
