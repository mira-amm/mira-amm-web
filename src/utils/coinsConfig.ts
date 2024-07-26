import {ReactNode} from "react";

import USDCIcon from "@/src/components/icons/coins/USDCoin/USDCIcon";
import BTCIcon from "@/src/components/icons/coins/Bitcoin/BTCIcon";
import USDTIcon from "@/src/components/icons/coins/Tether/USDTIcon";
import DAIIcon from "@/src/components/icons/coins/DAI/DAIIcon";
import ETHIcon from "@/src/components/icons/coins/Ethereum/ETHIcon";
import MimicIcon from "@/src/components/icons/coins/Mimic/MimicIcon";

export type CoinName = 'USDC' | 'BTC' | 'MIMIC' | 'USDT' | 'DAI' | 'ETH' | null;

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
      assetId: '0x176ef214c789d4a63ed296d6d67844de62e728e78148f549eeba4aedf450838f',
      fullName: 'mimicMira',
      icon: MimicIcon,
    },
  ],
  [
    'BTC',
    {
      name: 'BTC',
      decimals: 8,
      assetId: '0x85e0ca6a70b48465a3ed51993ab090eb3a5fc866ab9168c93fad665b2d7ba490',
      fullName: 'Bitcoin Test',
      icon: BTCIcon,
    },
  ],
  [
    'DAI',
    {
      name: 'DAI',
      decimals: 6,
      assetId: '0x418f96491bf04ceae3666d9aaa003176e10c513f18a1462a0b5e584b8e48f0b2',
      fullName: 'DAI Test',
      icon: DAIIcon,
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
    'USDC',
    {
      name: 'USDC',
      decimals: 6,
      assetId: '0x37065861e1a9107b8d5f20da971f0dfd81dac6b0ac3d55508a9cb7b1d73fdc5a',
      fullName: 'USDC Test',
      icon: USDCIcon,
    },
  ],
  [
    'USDT',
    {
      name: 'USDT',
      decimals: 6,
      assetId: '0xe3cfb76877c215d47b7e26a58f6fa523757206c56cf1e8a5c5c78b3624a65e1c',
      fullName: 'USDT Test',
      icon: USDTIcon,
    },
  ],
]);
