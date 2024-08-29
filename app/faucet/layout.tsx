import {ReactNode} from "react";
import {Metadata} from "next";

type Props = Readonly<{
  children: ReactNode;
}>;

export const metadata: Metadata = {
  title: 'Provide Liquidity on MIRA AMM | Earn Rewards with MIRA Liquidity Pools',
  description: "Contribute to liquidity pools on MIRA AMM. Get rewards for providing liquidity using MIRA protocol. Maximize your earnings with our incentive points program. Join our liquidity providers",
  openGraph: {
    title: "Swap on MIRA DEX instantly with low slippage | MIRA Swaps",
    url: 'https://mira.ly/faucet',
    description: "Contribute to liquidity pools on MIRA AMM. Get rewards for providing liquidity using MIRA protocol. Maximize your earnings with our incentive points program. Join our liquidity providers",
    images: 'https://mira.ly/images/preview.png',
  },
  twitter: {
    title: "Swap on MIRA DEX instantly with low slippage | MIRA Swaps",
    description: "Contribute to liquidity pools on MIRA AMM. Get rewards for providing liquidity using MIRA protocol. Maximize your earnings with our incentive points program. Join our liquidity providers",
    images: 'https://mira.ly/images/preview.png',
  },
};

const FaucetLayout = ({ children }: Props) => {
  return (
    <>
      {children}
    </>
  );
};

export default FaucetLayout;
