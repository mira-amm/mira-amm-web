import {ReactNode} from "react";
import {Metadata} from "next";

type Props = Readonly<{
  children: ReactNode;
}>;

export const metadata: Metadata = {
  title:
    "Provide Liquidity on MIRA AMM | Earn Rewards with MIRA Liquidity Pools",
  description:
    "Contribute to liquidity pools on MIRA AMM. Get rewards for providing liquidity using MIRA protocol. Maximize your earnings with our incentive points program. Join our liquidity providers",
  openGraph: {
    title:
      "Provide Liquidity on MIRA AMM | Earn Rewards with MIRA Liquidity Pools",
    url: "https://mira.ly/liquidity",
    description:
      "Contribute to liquidity pools on MIRA AMM. Get rewards for providing liquidity using MIRA protocol. Maximize your earnings with our incentive points program. Join our liquidity providers",
    images: "https://mira.ly/images/preview.png",
  },
  twitter: {
    title:
      "Provide Liquidity on MIRA AMM | Earn Rewards with MIRA Liquidity Pools",
    description:
      "Contribute to liquidity pools on MIRA AMM. Get rewards for providing liquidity using MIRA protocol. Maximize your earnings with our incentive points program. Join our liquidity providers",
    images: "https://mira.ly/images/preview.png",
  },
};

const LiquidityLayout = ({children}: Props) => {
  return <>{children}</>;
};

export default LiquidityLayout;
