"use client";

import Header from "@/src/components/common/Header/Header";
import FuelIcon from "@/src/components/icons/Fuel/FuelIcon";
import Swap from "@/src/components/common/Swap/Swap";
import DiscordIcon from "@/src/components/icons/Discord/DiscordIcon";
import XIcon from "@/src/components/icons/X/XIcon";
import Footer from "@/src/components/common/Footer/Footer";

import styles from "./LandingPageLayout.module.css";
import { clsx } from "clsx";
import LaunchAppButton from "@/src/components/common/LaunchAppButton/LaunchAppButton";
import { DiscordLink, XLink } from "@/src/utils/constants";
import { TechsDivider } from "../../common/TechsDivider/TechsDivider";
import { AchievementsDivider } from "../../common/AchievementsDivider/AchievementsDivider";
import { MainInfo } from "../../common/MainInfo/MainInfo";
import { InfoBlocks } from "../../common/InfoBlocks/InfoBlocks";
import { StepsBlock } from "../../common/StepsBlock/StepsBlock";
import LockIcon from "../../icons/LockIcon/LockIcon";
import VoteIcon from "../../icons/VoteIcon/VoteIcon";
import EarnIcon from "../../icons/EarnIcon/EarnIcon";
import { RoadMapBlock } from "../../common/RoadMapBlock/RoadMapBlock";
import { RoadMapIcon } from "../../common/RoadMapIcons/RoadMapIcon";
import RoadmapDesktop from "../../icons/Roadmap/RoadmapDesktop";
import { MiraApp } from "../../common/MiraApp/MiraApp";
import { LearnMoreButton } from "../../common/LearnMoreButton/LearnMoreButton";
import { StepsIcon } from "../../common/StepsIcon/StepsIcon";
import RoadmapMobile from "../../icons/Roadmap/RoadmapMobile";

const LandingPageLayout = () => {
  return (
    <>
      <Header isHomePage />
      <main className={clsx("mobileOnly", styles.main)}>
        <section className={styles.topBlock}>
          <h1>The Liquidity Hub on Fuel</h1>
          <h2 className={styles.subheading}>
            Trade, Earn and get Rewards using the most efficient AMM on Fuel
          </h2>
          <div className={styles.buttonsArea}>
          <LaunchAppButton className={styles.launchAppButton} />
          {/* <LearnMoreButton /> */}
          </div>
          {/* <div className={styles.fuel}>
            <FuelIcon />
            <span>Powered by Fuel</span>
          </div> */}
        </section>
        <Swap />
        <section className={styles.divider}>
          <TechsDivider />
        </section>
        <section className={styles.mainInfo}>
          <MainInfo
            title="Meet the First ve(3,3) DEX on Fuel*"
            description="The highest APR for LPs, with the lowest slippage and fees on swaps among other DEXs. Learn more about ve(3,3) "
            link="here"
          >
            <InfoBlocks title="Simple steps to maximize efficiency">
              <StepsBlock
                logo={<LockIcon />}
                title="Lock"
                description="your MIRA and get in return vote-escrowed MIRA (veMIRA)"
              />
              <StepsBlock
                logo={<VoteIcon />}
                title="Vote"
                description="veMIRA gives you the power to decide which pools should receive more MIRA emissions"
              />
              <StepsBlock
                logo={<EarnIcon />}
                title="Earn"
                description="After voting for a specific pool you can claim a share of the weekly incentives and trading fees allocated to that pool"
              />
            </InfoBlocks>
          </MainInfo>
        </section>
        <section className={styles.divider}>
          <AchievementsDivider />
        </section>
        <section className={styles.mainInfo}>
          <MainInfo
            title="MIRA’s Roadmap"
            description="Join us in on a journey to the future of the internet"
          >
            <RoadmapMobile />
            <InfoBlocks>
              <RoadMapBlock
                logo={<RoadMapIcon text="Testnet" />}
                title="Launch a basic DEX with stable swaps"
                description="July 2024"
                done={true}
              />
              <RoadMapBlock
                logo={<RoadMapIcon text="Mainnet" />}
                title="MIRA is LIVE on the same day as Fuel"
                description="Day one of the Fuel mainnet"
              />
              <RoadMapBlock
                logo={<RoadMapIcon text="POINTS" />}
                title="POINTS: Both MIRA and Fuel programs"
                description="After Fuel goes live on the mainnet"
              />
              <RoadMapBlock
                logo={<RoadMapIcon text="Ve(3,3)" />}
                title="Launch of ve(3,3) features and governance "
                description="Late 2024 / Early 2025"
              />
            </InfoBlocks>
          </MainInfo>
        </section>
        <section className={styles.miraBlock}>
          <MiraApp />
        </section>
        <section className={styles.bottomBlock}>
          <h3>Join early</h3>
          <p className={styles.subheading}>
            Connect with our thriving community
          </p>
          <a
            href={DiscordLink}
            className={clsx(styles.socialBlock, styles.discordBlock)}
            target="_blank"
          >
            <DiscordIcon />
            <p>Mira Discord community</p>
          </a>
          <a
            href={XLink}
            className={clsx(styles.socialBlock, styles.xBlock)}
            target="_blank"
          >
            <XIcon />
            <p>Follow us on X</p>
          </a>
        </section>
      </main>

      <main className={clsx("desktopOnly", styles.main)}>
        <section className={styles.topBlock}>
          <div className={styles.left}>
            <h1>The Liquidity Hub on Fuel</h1>
            <h2 className={styles.subheading}>
              Trade, Earn and get Rewards using the most efficient AMM on Fuel
            </h2>
            <div className={styles.buttonsArea}>
            <LaunchAppButton className={styles.launchAppButton} />
            {/* <LearnMoreButton /> */}
            </div>
            {/* <div className={styles.fuel}>
              <FuelIcon />
              <span>Powered by Fuel</span>
            </div> */}
          </div>
          <div className={styles.swap}>
            <Swap />
          </div>
        </section>
        <section className={styles.divider}>
          <TechsDivider />
        </section>
        <section className={styles.mainInfo}>
          <MainInfo
            title="Meet the First ve(3,3) DEX on Fuel*"
            description="The highest APR for LPs, with the lowest slippage and fees on swaps among other DEXs. Learn more about ve(3,3) "
            link="here"
          >
            <InfoBlocks title="Simple steps to maximize efficiency">
              <StepsBlock
                logo={<StepsIcon icon={< LockIcon/>} />}
                title="Lock"
                description="your MIRA and get in return vote-escrowed MIRA (veMIRA)"
              />
              <StepsBlock
                logo={<StepsIcon icon={< VoteIcon/>} />}
                title="Vote"
                description="veMIRA gives you the power to decide which pools should receive more MIRA emissions"
              />
              <StepsBlock
                logo={<StepsIcon icon={< EarnIcon/>} />}
                title="Earn"
                description="After voting for a specific pool you can claim a share of the weekly incentives and trading fees allocated to that pool"
              />
            </InfoBlocks>
          </MainInfo>
        </section>
        <section className={styles.divider}>
          <AchievementsDivider />
        </section>
        <section className={styles.mainInfo}>
          <MainInfo
            title="MIRA’s Roadmap"
            description="Join us in on a journey to the future of the internet"
          >
            <InfoBlocks>
              <RoadMapBlock
                logo={<RoadMapIcon text="Testnet" />}
                title="Launch a basic DEX with stable swaps"
                description="July 2024"
                done={true}
              />
              <RoadMapBlock
                logo={<RoadMapIcon text="Mainnet" />}
                title="MIRA is LIVE on the same day as Fuel"
                description="Day one of the Fuel mainnet"
              />
              <RoadMapBlock
                logo={<RoadMapIcon text="POINTS" />}
                title="POINTS: Both MIRA and Fuel programs"
                description="After Fuel goes live on the mainnet"
              />
              <RoadMapBlock
                logo={<RoadMapIcon text="Ve(3,3)" />}
                title="Launch of  ve(3,3) features and governance "
                description="Late 2024 / Early 2025"
              />
            </InfoBlocks>
            <RoadmapDesktop />
          </MainInfo>
        </section>
        <section className={styles.miraBlock}>
        <MiraApp />
        </section>
        <section className={styles.bottomBlock}>
          <div className={styles.bottomBlockText}>
            <h3>Join early</h3>
            <p className={styles.connect}>
              Connect with our thriving community
            </p>
          </div>
          <div className={styles.socialBlocks}>
            <a
              href={DiscordLink}
              className={clsx(styles.socialBlock, styles.discordBlock)}
              target="_blank"
            >
              <DiscordIcon />
              <p>Mira Discord community</p>
            </a>
            <a
              href={XLink}
              className={clsx(styles.socialBlock, styles.xBlock)}
              target="_blank"
            >
              <div className={styles.xIconWrapper}>
                <XIcon />
              </div>
              <p>Follow us on X</p>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default LandingPageLayout;
