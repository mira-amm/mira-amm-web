'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from './FaucetPageLayout.module.css';
import FaucetClaim from "@/src/components/common/FaucetClaim/FaucetClaim";
import Swap from "@/src/components/common/Swap/Swap";
import CupIcon from "@/src/components/icons/Cup/CupIcon";
import ExchangeIcon from "@/src/components/icons/Exchange/ExchangeIcon";

const FaucetPageLayout = () => {
  return (
    <>
      <Header />
      <main className={styles.faucetPageLayout}>
        <BackLink />
        <section className={styles.greetingSection}>
          <img src="/images/lizard.png" className={styles.lizardImage} alt="Faucet" />
          <div className={styles.description}>
            <h1 className={styles.heading}>
              Meet
              <br className='mobileOnly'/>
              <span className='desktopOnly'>&nbsp;</span>
              <span className={styles.headingHighlight}>$mimicMIRA</span>
            </h1>
            <p className={styles.descriptionText}>
              Step into the MIRA miracle world, where traders become
              <br className='desktopOnly' />
              chameleons, blending seamlessly into the bustling markets.
              <br />
              With $mimicMIRA you can adopt the perfect disguise,&nbsp;
              <br className='desktopOnly' />
              mirroring the movements of the most skilled traders
            </p>
          </div>
        </section>
        <section className={styles.claimSection}>
          <h2 className={styles.claimHeading}>
            Three simple steps to claim your
            <br className='desktopOnly' />
            $mimicMIRA
          </h2>
          <FaucetClaim />
        </section>
        <section className={styles.conditionsSection}>
          <h2 className={styles.claimHeading}>
            You can request&nbsp;
            <br className='mobileOnly'/>
            $mimicMIRA for testing
            <br />
            once per account
          </h2>
          <div className={styles.conditions}>
            <div className={styles.condition}>
              <div className={styles.conditionIcon}>
                <CupIcon />
              </div>
              <p>
                <span className={styles.highlight}>Claim </span>
                $mimicMIRA first
              </p>
            </div>
            <div className={styles.condition}>
              <div className={styles.conditionIcon}>
                <ExchangeIcon />
              </div>
              <p>
                <span className={styles.highlight}>Swap </span>
                $mimicMIRA to more token
              </p>
            </div>
          </div>
        </section>
        <section className={styles.swapSection}>
          <Swap />
        </section>
      </main>
      <Footer/>
    </>
  );
};

export default FaucetPageLayout;
