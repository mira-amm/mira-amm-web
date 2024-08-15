import {ReactNode} from "react";
import {Metadata} from "next";

type Props = Readonly<{
  children: ReactNode;
}>;

export const metadata: Metadata = {
  title: 'Fuel Test Sepolia ETH Faucet | MIRA DEX',
};

const FaucetLayout = ({ children }: Props) => {
  return (
    <>
      {children}
    </>
  );
};

export default FaucetLayout;
