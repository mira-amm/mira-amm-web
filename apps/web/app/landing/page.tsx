import LaunchAppButton from "@/src/components/common/LaunchAppButton/LaunchAppButton";
import Swap from "@/src/components/common/Swap/Swap";
import FuelIcon from "@/src/components/icons/Fuel/FuelIcon";
import DiscordIcon from "@/src/components/icons/Discord/DiscordIcon";
import XIcon from "@/src/components/icons/X/XIcon";
import LockIcon from "@/src/components/icons/LockIcon/LockIcon";
import VoteIcon from "@/src/components/icons/VoteIcon/VoteIcon";
import EarnIcon from "@/src/components/icons/EarnIcon/EarnIcon";
import RoadmapDesktop from "@/src/components/icons/Roadmap/RoadmapDesktopIcon";
import RoadmapMobile from "@/src/components/icons/Roadmap/RoadmapMobileIcon";

import { TechsDivider } from "@/src/components/common/TechsDivider/TechsDivider";
import { Divider } from "@/src/components/common/Divider/Divider";
import { DividerText } from "@/src/components/common/DividerText/dividerText";
import { MainInfo } from "@/src/components/common/MainInfo/MainInfo";
import { InfoBlocks } from "@/src/components/common/InfoBlocks/InfoBlocks";
import { StepsBlock } from "@/src/components/common/StepsBlock/StepsBlock";
import { RoadMapBlock } from "@/src/components/common/RoadMapBlock/RoadMapBlock";
import { RoadMapIcon } from "@/src/components/common/RoadMapIcons/RoadMapIcon";
import { StepsIcon } from "@/src/components/common/StepsIcon/StepsIcon";
import { MiraApp } from "@/src/components/common/MiraApp/MiraApp";

import { DiscordLink, XLink } from "@/src/utils/constants";

export default function Page(){
  return (
    <>
      <main className="flex flex-col gap-[56px] px-4 pt-[84px] pb-[56px] lg:max-w-[1084px] lg:px-4 lg:pt-[100px] lg:pb-[48px] lg:gap-[100px] lg:mx-auto">
        {/* Top Section */}
        <section className="flex flex-col gap-4 items-center lg:flex-row lg:w-full lg:gap-[72px] lg:mb-[-15px]">
          <div className="lg:max-w-[572px] flex flex-col gap-[32px] self-start">
            <h1 className="text-[58px] leading-[72px]">The Liquidity Hub on Fuel</h1>
            <h2 className="font-normal text-[16px] leading-[22px] text-content-secondary mb-[22px] lg:text-[20px] lg:leading-[28px] lg:mb-0">
              Trade, Earn and get Rewards using the most efficient AMM on Fuel
            </h2>
            <div className="flex flex-col items-center gap-3 w-full lg:flex-row">
              <LaunchAppButton className="w-full" />
              <a
                className="w-full"
                href="https://mirror.xyz/miraly.eth/gIYyYWmf4_ofBY3mb9-AwcnwIfe4-1iK6kdUlJMjfn8"
                target="_blank"
              >
    <button
      className="w-full rounded-[12px] py-4 h-[56px] bg-[#2e2e2e] border-none text-[18px] leading-[24px] font-semibold text-content-primary text-center inline-flex justify-center items-center cursor-pointer"
    >
      Learn More
    </button>
              </a>
            </div>
            <div className="w-full flex justify-center items-center gap-2 text-[14px] leading-[18px] text-content-dimmed-dark lg:justify-start lg:text-[16px] lg:leading-[22px]">
              <FuelIcon />
              <span>Powered by Fuel</span>
            </div>
          </div>
          <div className="w-full max-w-md">
            <Swap />
          </div>
        </section>

        {/* Divider */}
        <section className="bg-[#1b2749] w-screen self-center lg:py-[28px]">
          <TechsDivider />
        </section>

        {/* Main Info Section */}
        <section className="flex flex-col items-center mb-6 lg:gap-5 lg:mb-5">
          <div className="mb-10 lg:mb-[20px]">
            <RoadMapIcon text="Coming Soon" />
          </div>
          <MainInfo
            title="Meet the First ve(3,3) DEX on Fuel*"
            description="The highest APR for LPs, with the lowest slippage and fees on swaps among other DEXs"
          >
            <InfoBlocks title="Simple steps to maximize efficiency">
              <StepsBlock
                logo={<StepsIcon icon={<LockIcon />} />}
                title="Lock"
                description="Mira can be locked in return for escrowed Mira (veMIRA)"
              />
              <StepsBlock
                logo={<StepsIcon icon={<VoteIcon />} />}
                title="Vote"
                description="veMIRA gives you the power to decide which pools should receive more MIRA emissions"
              />
              <StepsBlock
                logo={<StepsIcon icon={<EarnIcon />} />}
                title="Earn"
                description="After voting for a specific pool you can claim a share of the weekly incentives and trading fees allocated to that pool"
              />
            </InfoBlocks>
          </MainInfo>
        </section>

        {/* Achievements Divider */}
        <section className="bg-[#1b2749] w-screen self-center lg:py-[28px]">
          <Divider className="p-0 lg:p-5 lg:px-4">
            <DividerText text="The next-generation AMM for Fuel" />
          </Divider>
        </section>

        {/* Roadmap Section */}
        <section className="flex flex-col items-center mb-6 lg:gap-5 lg:mb-5">
          <MainInfo
            title="MIRA’s Roadmap"
            description="Join us in on a journey to the future of the internet"
          >
            <div className="lg:hidden">
              <RoadmapMobile />
            </div>
            <InfoBlocks>
              <RoadMapBlock
                logo={<RoadMapIcon text="Testnet" />}
                title="Basic AMM with volatile and stable swaps feature complete"
                description="July 2024"
                done
              />
              <RoadMapBlock
                logo={<RoadMapIcon text="Mainnet" />}
                title="Basic AMM is live on Fuel L2 Mainnet with Fuel network points"
                description="Day one of the Fuel mainnet"
                done
              />
              <RoadMapBlock
                logo={<RoadMapIcon text="Mainnet" />}
                title="Mira DApps points program"
                description="After Fuel goes live on the mainnet"
              />
              <RoadMapBlock
                logo={<RoadMapIcon text="Mainnet" />}
                title="ve(3,3) features and governance"
                description="Late 2024 / Early 2025"
              />
            </InfoBlocks>
            <div className="hidden lg:block">
              <RoadmapDesktop />
            </div>
          </MainInfo>
        </section>

        {/* Mira App */}
        <section className="flex flex-col items-center justify-center mb-6">
          <MiraApp />
        </section>

        {/* Social Block */}
        <section className="flex flex-col gap-4 items-center lg:flex-row lg:p-[32px_40px] lg:rounded-[24px] lg:bg-[rgba(80,127,247,0.1)] lg:shadow-[inset_1px_1px_14px_0_rgba(255,255,255,0.05)]">
          <div className="w-full flex flex-col gap-4 text-center lg:w-1/2 lg:text-left">
            <h3 className="text-5xl font-bold">Be early</h3>
            <p className="text-content-secondary">Connect with our thriving community</p>
          </div>
          <div className="w-full flex flex-col items-center gap-3 lg:flex-row lg:w-1/2 lg:gap-4">
            <a
              href={DiscordLink}
              className="h-[149px] w-full flex flex-col justify-center items-center gap-3 rounded-[16px] bg-[#32389f] lg:w-[230px] lg:h-[230px]"
              target="_blank"
            >
              <DiscordIcon />
              <p>Mira Discord community</p>
            </a>
            <a
              href={XLink}
              className="h-[149px] w-full flex flex-col justify-center items-center gap-3 rounded-[16px] bg-[#040305] lg:w-[230px] lg:h-[230px]"
              target="_blank"
            >
              <div className="py-[7px]">
                <XIcon />
              </div>
              <p>Follow us on X</p>
            </a>
          </div>
        </section>
      </main>
    </>
  );
};
