import { ReactNode } from "react";

import USDCIcon from "@/src/components/icons/coins/USDCoin/USDCIcon";
import BTCIcon from "@/src/components/icons/coins/Bitcoin/BTCIcon";

type CoinName = 'USDC' | 'BTC';

type CoinData = {
  name: CoinName;
  assetId: string;
  decimals: number;
  fullName?: string;
  icon?: () => ReactNode;
};

export const coinsConfig: Map<string, CoinData> = new Map(
  Object.entries({
    USDC: {
      name: 'USDC',
      decimals: 6,
      assetId:
        '0xfed3ee85624c79cb18a3a848092239f2e764ed6b0aa156ad10a18bfdbe74269f',
      fullName: 'USD Coin',
      icon: USDCIcon,
    },
    BTC: {
      name: 'BTC',
      decimals: 8,
      assetId:
        '0xccceae45a7c23dcd4024f4083e959a0686a191694e76fa4fb76c449361ca01f7',
      fullName: 'Bitcoin',
      icon: BTCIcon,
    },
  })
);
