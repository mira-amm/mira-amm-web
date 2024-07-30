import {ReactNode} from "react";

import BTCIcon from "@/src/components/icons/coins/Bitcoin/BTCIcon";
import USDTIcon from "@/src/components/icons/coins/Tether/USDTIcon";
import ETHIcon from "@/src/components/icons/coins/Ethereum/ETHIcon";
import MimicIcon from "@/src/components/icons/coins/Mimic/MimicIcon";

export type CoinName = 'BTC' | 'MIMIC' | 'USDT' | 'ETH' | null;

type CoinData = {
  name: CoinName;
  assetId: string;
  decimals: number;
  fullName?: string;
  icon?: () => ReactNode;
};

export const coinsConfig: Map<CoinName, CoinData> = new Map([
  [
    'MIMIC',
    {
      name: 'MIMIC',
      decimals: 9,
      assetId: '0x1fd9caea4559caac4b7b6f28d0e608c6827f307a780e99547e69d57c77acd6f5',
      fullName: 'mimicMira',
      icon: MimicIcon,
    },
  ],
  [
    'BTC',
    {
      name: 'BTC',
      decimals: 8,
      assetId: '0xce90621a26908325c42e95acbbb358ca671a9a7b36dfb6a5405b407ad1efcd30',
      fullName: 'Bitcoin Test',
      icon: BTCIcon,
    },
  ],
  // [
  //   'DAI',
  //   {
  //     name: 'DAI',
  //     decimals: 6,
  //     assetId: '0x418f96491bf04ceae3666d9aaa003176e10c513f18a1462a0b5e584b8e48f0b2',
  //     fullName: 'DAI Test',
  //     icon: DAIIcon,
  //   },
  // ],
  [
    'ETH',
    {
      name: 'ETH',
      decimals: 9,
      assetId: '0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07',
      fullName: 'Ethereum',
      icon: ETHIcon,
    },
  ],
  // [
  //   'USDC',
  //   {
  //     name: 'USDC',
  //     decimals: 6,
  //     assetId: '0x37065861e1a9107b8d5f20da971f0dfd81dac6b0ac3d55508a9cb7b1d73fdc5a',
  //     fullName: 'USDC Test',
  //     icon: USDCIcon,
  //   },
  // ],
  [
    'USDT',
    {
      name: 'USDT',
      decimals: 6,
      assetId: '0x3f007b72f7bcb9b1e9abe2c76e63790cd574b7c34f1c91d6c2f407a5b55676b9',
      fullName: 'USDT Test',
      icon: USDTIcon,
    },
  ],
]);
