'use client';

import Header from "@/src/components/common/Header/Header";
import FuelIcon from "@/src/components/icons/Fuel/FuelIcon";
import Swap from "@/src/components/common/Swap/Swap";
import DiscordIcon from "@/src/components/icons/Discord/DiscordIcon";
import XIcon from "@/src/components/icons/X/XIcon";
import Footer from "@/src/components/common/Footer/Footer";

import styles from './LandingPageLayout.module.css';
import {clsx} from "clsx";
import LaunchAppButton from "@/src/components/common/LaunchAppButton/LaunchAppButton";
import {DiscordLink, XLink} from "@/src/utils/constants";

const LandingPageLayout = () => {
  return (
    <>
      <Header isHomePage/>
      <main className={clsx('mobileOnly', styles.main)}>
        <section className={styles.topBlock}>
          <h1>The Liquidity Hub on Fuel</h1>
          <h2 className={styles.subheading}>
            Trade, Earn and get Rewards using the most efficient AMM on Fuel
          </h2>
          <LaunchAppButton />
          <div className={styles.fuel}>
            <FuelIcon/>
            <span>Powered by Fuel</span>
          </div>
        </section>
        <Swap/>
        <section className={styles.bottomBlock}>
          <h3>Join early</h3>
          <p className={styles.subheading}>
            Connect with our thriving community
          </p>
          <a href={DiscordLink} className={clsx(styles.socialBlock, styles.discordBlock)} target="_blank">
            <DiscordIcon/>
            <p>Mira Discord community</p>
          </a>
          <a href={XLink} className={clsx(styles.socialBlock, styles.xBlock)} target="_blank">
            <XIcon/>
            <p>Follow us on X</p>
          </a>
        </section>
      </main>

      <main className={clsx('desktopOnly', styles.main)}>
        <section className={styles.topBlock}>
          <div className={styles.left}>
            <h1>The Liquidity Hub on Fuel</h1>
            <h2 className={styles.subheading}>
              Trade, Earn and get Rewards using the most efficient AMM on Fuel
            </h2>
            <LaunchAppButton className={styles.launchAppButton} />
            <div className={styles.fuel}>
              <FuelIcon/>
              <span>Powered by Fuel</span>
            </div>
          </div>
          <div className={styles.swap}>
            <Swap/>
          </div>
        </section>
        <section className={styles.bottomBlock}>
          <div className={styles.bottomBlockText}>
            <h3>Join early</h3>
            <p className={styles.connect}>
              Connect with our thriving community
            </p>
          </div>
          <div className={styles.socialBlocks}>
            <a href={DiscordLink} className={clsx(styles.socialBlock, styles.discordBlock)} target="_blank">
              <DiscordIcon/>
              <p>Mira Discord community</p>
            </a>
            <a href={XLink} className={clsx(styles.socialBlock, styles.xBlock)} target="_blank">
              <div className={styles.xIconWrapper}>
                <XIcon/>
              </div>
              <p>Follow us on X</p>
            </a>
          </div>
        </section>
      </main>
      <Footer/>
    </>
  );
}

export default LandingPageLayout;
