"use client";

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import BackLink from "@/src/components/common/BackLink/BackLink";
import Pools from "@/src/components/pages/liquidity-page/components/Pools/Pools";
import Positions from "@/src/components/pages/liquidity-page/components/Positions/Positions";
import PromoBlock from "@/src/components/common/PromoBlock/PromoBlock";

import styles from "./LiquidityPageLayout.module.css";
import {
  LIQUIDITY_PROVIDING_DOC_URL,
  POINTS_LEARN_MORE_URL,
} from "@/src/utils/constants";
import Boosts from "./components/Boosts/Boosts";
import LearnMoreIcon from "@/assets/learn-more.png";
import BoostIcon from "@/assets/learn-more-2.png";
import Image from "next/image";
import clsx from "clsx";

const LiquidityPageLayout = () => {
  return (
    <>
      <Header />
      <main className={clsx("page-container", styles.liquidityPageContainer)}>
        <Boosts />
        <Positions />
        <Pools />
        <div className={styles.promoBlocks}>
          <PromoBlock
            icon={
              <Image
                src={LearnMoreIcon}
                alt={"learn more"}
                width={48}
                height={48}
                priority
                placeholder="blur"
              />
            }
            title="Learn about providing liquidity"
            link={LIQUIDITY_PROVIDING_DOC_URL}
            linkText="Click here and check our v3 LP walktrought"
          />
          <PromoBlock
            icon={
              <Image
                src={BoostIcon}
                alt={"boost icon"}
                width={48}
                height={48}
                priority
                placeholder="blur"
              />
            }
            title="Fuel Boost Program"
            link={POINTS_LEARN_MORE_URL}
            linkText="Learn about boost rewards"
          />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LiquidityPageLayout;
