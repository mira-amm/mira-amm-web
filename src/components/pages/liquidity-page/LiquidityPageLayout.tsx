'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import BackLink from "@/src/components/common/BackLink/BackLink";
import Pools from "@/src/components/pages/liquidity-page/components/Pools/Pools";
import Positions from "@/src/components/pages/liquidity-page/components/Positions/Positions";
import PromoBlock from "@/src/components/pages/liquidity-page/components/PromoBlock/PromoBlock";
import StarsIcon from "@/src/components/icons/Stars/StarsIcon";
import CupIcon from "@/src/components/icons/Cup/CupIcon";

import styles from './LiquidityPageLayout.module.css';

const LiquidityPageLayout = () => {
  return (
    <>
      <Header />
      <main className={styles.liquidityPageLayout}>
        <BackLink />
        <Positions />
        <Pools />
        <div className={styles.promoBlocks}>
          <PromoBlock icon={<StarsIcon />}
                      title="Learn about providing liquidity"
                      link="#"
                      linkText="Click here to see the guide"
          />
          <PromoBlock icon={<CupIcon />}
                      title="Fuel Points Program"
                      link="#"
                      linkText="Join the Fuel Points program with MIRA Protocol. Learn more"
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

export default LiquidityPageLayout;
