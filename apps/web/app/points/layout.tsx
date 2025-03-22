import {ReactNode} from "react";
import {Metadata} from "next";

type Props = Readonly<{
  children: ReactNode;
}>;

export const metadata: Metadata = {
  title: "MIRA Points Program | Earn rewards for your activity",
  description:
    "Participate in the MIRA Points Program. Earn points by providing liquidity and engaging in activities on the Fuel blockchain. Track your progress and climb the leaderboard.",
  openGraph: {
    title: "MIRA Points Program | Earn rewards for your activity",
    url: "https://mira.ly/points",
    description:
      "Participate in the MIRA Points Program. Earn points by providing liquidity and engaging in activities on the Fuel blockchain. Track your progress and climb the leaderboard.",
    images: "https://mira.ly/images/preview.png",
  },
  twitter: {
    title: "MIRA Points Program | Earn rewards for your activity",
    description:
      "Participate in the MIRA Points Program. Earn points by providing liquidity and engaging in activities on the Fuel blockchain. Track your progress and climb the leaderboard.",
    images: "https://mira.ly/images/preview.png",
  },
};

const PointsLayout = ({children}: Props) => {
  return <>{children}</>;
};

export default PointsLayout;
