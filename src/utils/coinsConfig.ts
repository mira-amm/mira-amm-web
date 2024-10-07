import {ReactNode} from "react";

import BTCIcon from "@/src/components/icons/coins/Bitcoin/BTCIcon";
import USDTIcon from "@/src/components/icons/coins/Tether/USDTIcon";
import ETHIcon from "@/src/components/icons/coins/Ethereum/ETHIcon";

export type CoinName = 'BTC' | 'USDT' | 'ETH' | 'MIMIC' | null;

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
  [
    'BTC',
    {
      name: 'BTC',
      decimals: 8,
      assetId: '0xce90621a26908325c42e95acbbb358ca671a9a7b36dfb6a5405b407ad1efcd30',
      fullName: 'Bitcoin Test',
      icon: BTCIcon,
      subId: '0x0000000000000000000000000000000000000000000000000000000000000004',
      contractId: '0xa1ada1dcab2524dc7f030bbff36c14ede24efd8becffac022a4c501e977e13c6'
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
      subId: '0x0000000000000000000000000000000000000000000000000000000000000002',
      contractId: '0xa1ada1dcab2524dc7f030bbff36c14ede24efd8becffac022a4c501e977e13c6'
    },
  ],
]);
