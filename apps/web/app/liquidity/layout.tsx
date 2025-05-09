import {ReactNode} from "react";
import {Metadata} from "next";

type Props = Readonly<{
  children: ReactNode;
}>;

export const metadata: Metadata = {
  title:
    "Provide Liquidity on MICROCHAIN | Earn Rewards with MICROCHAIN Liquidity Pools",
  description:
    "Contribute to liquidity pools on MICROCHAIN. Get rewards for providing liquidity using MICROCHAIN protocol. Maximize your earnings with our incentive points program. Join our liquidity providers",
  openGraph: {
    title:
      "Provide Liquidity on MICROCHAIN | Earn Rewards with MICROCHAIN Liquidity Pools",
    url: "https://mira.ly/liquidity",
    description:
      "Contribute to liquidity pools on MICROCHAIN. Get rewards for providing liquidity using MICROCHAIN protocol. Maximize your earnings with our incentive points program. Join our liquidity providers",
    images: "https://mira.ly/images/preview.png",
  },
  twitter: {
    title:
      "Provide Liquidity on MICROCHAIN | Earn Rewards with MICROCHAIN Liquidity Pools",
    description:
      "Contribute to liquidity pools on MICROCHAIN. Get rewards for providing liquidity using MICROCHAIN protocol. Maximize your earnings with our incentive points program. Join our liquidity providers",
    images: "https://mira.ly/images/preview.png",
  },
};

const LiquidityLayout = ({children}: Props) => {
  return <>{children}</>;
};

export default LiquidityLayout;
