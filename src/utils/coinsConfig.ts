import {ReactNode} from "react";

import USDTIcon from "@/src/components/icons/coins/Tether/USDTIcon";
import ETHIcon from "@/src/components/icons/coins/Ethereum/ETHIcon";
import USDCIcon from "@/src/components/icons/coins/USDCoin/USDCIcon";

export type CoinName = 'USDC' | 'USDT' | null;

type CoinData = {
  name: CoinName;
  assetId: string;
  decimals: number;
  fullName?: string;
  icon?: () => ReactNode;
  contractId?: string;
  subId?: string;
};

export const coinsConfig: Map<CoinName, CoinData> = new Map([
  // [
  //   'ETH',
  //   {
  //     name: 'ETH',
  //     decimals: 9,
  //     assetId: '0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07',
  //     fullName: 'Ethereum',
  //     icon: ETHIcon,
  //   },
  // ],
  [
    'USDT',
    {
      name: 'USDT',
      decimals: 6,
      assetId: '0xa0265fb5c32f6e8db3197af3c7eb05c48ae373605b8165b6f4a51c5b0ba4812e',
      fullName: 'USDT',
      icon: USDTIcon,
    },
  ],
  [
    'USDC',
    {
      name: 'USDC',
      decimals: 6,
      assetId: '0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b',
      fullName: 'USDC',
      icon: USDCIcon,
    },
  ],
]);
