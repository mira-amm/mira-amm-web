import {ReactNode} from "react";
import {Metadata} from "next";

type Props = Readonly<{
  children: ReactNode;
}>;

export const metadata: Metadata = {
  title: "Swap on MIRA DEX instantly with low slippage | MIRA Swaps",
  description:
    "Discover seamless crypto swaps with MIRA DEX. Swap your digital assets instantly and securely on the Fuel blockchain. Enjoy best rates and minimal slippage with our optimized trading protocol",
  openGraph: {
    title: "Swap on MIRA DEX instantly with low slippage | MIRA Swaps",
    url: "https://mira.ly/swap",
    description:
      "Discover seamless crypto swaps with MIRA DEX. Swap your digital assets instantly and securely on the Fuel blockchain. Enjoy best rates and minimal slippage with our optimized trading protocol",
    images: "https://mira.ly/images/preview.png",
  },
  twitter: {
    title: "Swap on MIRA DEX instantly with low slippage | MIRA Swaps",
    description:
      "Discover seamless crypto swaps with MIRA DEX. Swap your digital assets instantly and securely on the Fuel blockchain. Enjoy best rates and minimal slippage with our optimized trading protocol",
    images: "https://mira.ly/images/preview.png",
  },
};

const SwapLayout = ({children}: Props) => {
  return <>{children}</>;
};

export default SwapLayout;
