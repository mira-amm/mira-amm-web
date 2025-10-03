import MicrochainTextLogo from "@/src/components/common/Logo/MicrochainTextLogo";
import {
  HalbornIcon as Halborn,
  FuelGroup,
  OttersecIcon,
  FuelIcon,
  DiscordIcon,
  XIcon,
  LockIcon,
  VoteIcon,
  EarnIcon,
  RoadmapDesktopIcon as RoadmapDesktop,
  RoadmapMobileIcon as RoadmapMobile,
} from "@/meshwave-ui/icons";

import {
  UsedTechs,
  Divider,
  DividerText,
  MainInfo,
  InfoBlocks,
  StepsBlock,
  RoadMapBlock,
  RoadMapIcon,
  StepsIcon,
} from "@/src/components/common";

import {DiscordLink, XLink, BlogLink} from "@/src/utils/constants";
import {Swap} from "@/src/components/common/Swap/Swap";
import {Button} from "@/meshwave-ui/Button";
import Link from "next/link";

function HeroSection() {
  return (
    <header className="flex flex-col gap-4 items-center lg:flex-row sm:w-full lg:gap-16 lg:-mb-4">
      <div className="w-full lg:max-w-2xl flex flex-col gap-8 items-center md:self-start">
        <h1 className="font-bold text-5xl leading-tight">
          The Liquidity Hub on Fuel
        </h1>
        <p className="font-normal text-sm lg:self-start leading-5 text-content-dimmed-light mb-5 lg:text-base lg:leading-7 lg:mb-0">
          Trade, Earn and get Rewards using the most efficient AMM on Fuel
        </p>
        <nav
          aria-label="Primary actions"
          className="flex flex-col items-center gap-3 w-full max-lg:max-w-md lg:flex-row"
        >
          <Link href="/swap" className="w-full">
            <Button className="h-14" block>
              Launch App
            </Button>
          </Link>
          <a
            className="w-full"
            href={BlogLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full rounded-lg py-4 h-14 bg-old-mira-btn border-none text-lg leading-6 font-semibold text-content-primary text-center inline-flex justify-center items-center cursor-pointer hover:bg-old-mira-btn">
              Learn More
            </Button>
          </a>
        </nav>
        <p className="w-full flex justify-center items-center gap-2 text-xs leading-4 text-content-dimmed-dark lg:justify-start lg:text-sm lg:leading-6">
          <FuelIcon aria-hidden="true" />
          <span>Powered by Fuel</span>
        </p>
      </div>
      <aside className="w-full max-w-md" aria-label="Swap module">
        <Swap />
      </aside>
    </header>
  );
}

function AuditSection() {
  return (
    <section
      className="bg-old-mira-audit w-screen self-center lg:py-7"
      aria-labelledby="audit-title"
    >
      <Divider className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-40 px-6 lg:px-12 py-6">
        <h2 id="audit-title" className="sr-only">
          Security and Support
        </h2>
        <DividerText text="Trade with confidence" dimmed />
        <div className="flex items-center gap-4">
          <UsedTechs text="Audited by">
            <a
              href="https://docs.microchain.systems/developer-guides/security-audit"
              target="_blank"
              rel="noopener noreferrer"
            >
              <OttersecIcon />
            </a>
            <a
              href="https://docs.microchain.systems/developer-guides/security-audit"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Halborn />
            </a>
          </UsedTechs>
        </div>
        <div className="flex items-center gap-4">
          <UsedTechs text="Supported by">
            <a
              href="https://fuel.network"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2"
            >
              <FuelGroup />
            </a>
          </UsedTechs>
        </div>
      </Divider>
    </section>
  );
}

function MainInfoSection() {
  return (
    <section
      className="flex flex-col items-center mb-6 lg:gap-5 lg:mb-5"
      aria-labelledby="main-info-heading"
    >
      <div className="mb-10 lg:mb-5">
        <RoadMapIcon text="Coming Soon" />
      </div>
      <MainInfo
        title="Meet the First ve(3,3) DEX on Fuel*"
        description="The highest APR for LPs, with the lowest slippage and fees on swaps among other DEXs"
      >
        <article aria-labelledby="main-info-heading">
          <h2 id="main-info-heading" className="sr-only">
            How Microchain Works
          </h2>
          <InfoBlocks title="Simple steps to maximize efficiency">
            <StepsBlock
              logo={<StepsIcon icon={<LockIcon />} />}
              title="Lock"
              description="MIRA can be locked in return for escrowed MIRA (veMIRA)"
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
        </article>
      </MainInfo>
    </section>
  );
}

function AchievementsDivider() {
  return (
    <section
      className="bg-old-mira-audit w-screen self-center lg:py-7"
      aria-label="AMM Highlight"
    >
      <Divider className="p-5 lg:px-4">
        <DividerText text="The next-generation AMM for Fuel" />
      </Divider>
    </section>
  );
}

function RoadmapSection() {
  return (
    <section
      className="flex flex-col items-center mb-6 lg:gap-5 lg:mb-5"
      aria-labelledby="roadmap-heading"
    >
      <MainInfo
        title="Microchain's Roadmap"
        description="Join us in on a journey to the future of the internet"
      >
        <div
          className="lg:hidden"
          role="region"
          aria-label="Roadmap mobile view"
        >
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
            title="Microchain DApps points program"
            description="After Fuel goes live on the mainnet"
            done
          />
          <RoadMapBlock
            logo={<RoadMapIcon text="Mainnet" />}
            title="ve(3,3) features and governance"
            description="Late 2024 / Early 2025"
          />
        </InfoBlocks>
        <div
          className="hidden lg:block"
          role="region"
          aria-label="Roadmap desktop view"
        >
          <RoadmapDesktop />
        </div>
      </MainInfo>
    </section>
  );
}

function WelcomeSection() {
  return (
    <section
      className="flex flex-col items-center justify-center mb-6"
      aria-labelledby="welcome-heading"
    >
      <figure className="flex flex-col items-center gap-5 mb-5 lg:gap-4">
        <MicrochainTextLogo />
        <figcaption>
          <h2
            id="welcome-heading"
            className="text-5xl leading-tight text-center mt-3 font-[var(--font-prompt)] lg:text-3xl lg:leading-10"
          >
            Welcome to Microchain
          </h2>
        </figcaption>
        <p className="font-normal text-lg leading-7 text-center text-content-dimmed-light mb-3 lg:text-base lg:leading-6">
          Exceptional capital efficiency with robust liquidity and minimal fees
        </p>
        <a
          href="/swap"
          className="py-4 lg:w-full lg:text-base lg:leading-6 flex justify-center"
        >
          <Button className="w-60 h-14">Launch App</Button>
        </a>
      </figure>
    </section>
  );
}

function SocialSection() {
  return (
    <section
      className="flex flex-col gap-4 items-center lg:flex-row lg:px-10 lg:py-8 lg:rounded-2xl lg:bg-old-mira-social lg:shadow-[inset_1px_1px_14px_0_rgba(255,255,255,0.05)]"
      aria-labelledby="social-heading"
    >
      <div className="w-full flex flex-col gap-4 text-center lg:w-1/2 lg:text-left">
        <h3 id="social-heading" className="text-5xl font-bold">
          Be early
        </h3>
        <p className="text-content-secondary">
          Connect with our thriving community
        </p>
      </div>
      <nav
        className="w-full flex flex-col items-center gap-3 lg:flex-row lg:w-1/2 lg:gap-4"
        aria-label="Social links"
      >
        <a
          href={DiscordLink}
          className="h-36 w-full flex flex-col justify-center items-center gap-3 rounded-xl bg-old-mira-discord max-w-md lg:w-56 lg:h-56"
          target="_blank"
          rel="noopener noreferrer"
        >
          <DiscordIcon />
          <p>Microchain Discord community</p>
        </a>
        <a
          href={XLink}
          className="h-36 w-full flex flex-col justify-center items-center gap-3 rounded-xl bg-old-mira-x max-w-md lg:w-56 lg:h-56"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="py-2">
            <XIcon />
          </div>
          <p>Follow us on X</p>
        </a>
      </nav>
    </section>
  );
}

export default function Page() {
  return (
    <main className="flex flex-col gap-14 px-4 pt-20 pb-14 lg:max-w-5xl lg:px-4 lg:pt-24 lg:pb-12 lg:gap-24 lg:mx-auto">
      <HeroSection />
      <AuditSection />
      <MainInfoSection />
      <AchievementsDivider />
      <RoadmapSection />
      <WelcomeSection />
      <SocialSection />
    </main>
  );
}
