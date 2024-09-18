import {ReactNode} from "react";

import BTCIcon from "@/src/components/icons/coins/Bitcoin/BTCIcon";
import USDTIcon from "@/src/components/icons/coins/Tether/USDTIcon";
import ETHIcon from "@/src/components/icons/coins/Ethereum/ETHIcon";

export type CoinName = 'BTC' | 'USDT' | 'ETH' | null;

type CoinData = {
  name: CoinName;
  assetId: string;
  decimals: number;
  fullName?: string;
  icon?: () => ReactNode;
};

export const coinsConfig: Map<CoinName, CoinData> = new Map([
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
