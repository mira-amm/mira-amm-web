import {Logo, BrandText} from "@/src/components/common";
import {BlogLink, DiscordLink, XLink} from "@/src/utils/constants";
import {DiscordIcon, XSocialIcon, GithubIcon} from "@/meshwave-ui/icons";
import {ModeToggle} from "@/src/components/common/toggle-mode";

export default function Footer() {
  return (
    <footer className="flex flex-col border-t w-full py-4 px-4 max-w-6xl mx-auto mt-32">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center lg:gap-[134px]">
        <Logo isFooter />
        <div className="flex flex-col lg:flex-row gap-3 text-base leading-[22px] text-content-tertiary font-normal lg:w-[650px] lg:text-lg lg:leading-6">
          <a
            className="lg:px-4 text-base text-content-tertiary hover:text-content-primary hover:no-underline"
            href={DiscordLink}
            target="_blank"
            rel="noopener"
          >
            Support
          </a>

          <a
            href="https://docs.microchain.systems/resources/security-audits"
            target="_blank"
            rel="noopener"
            className="lg:px-4 text-base text-content-tertiary hover:text-content-primary hover:no-underline"
          >
            Security Audit
          </a>
          <a
            href="https://docs.microchain.systems"
            className="lg:px-4 text-base text-content-tertiary hover:text-content-primary hover:no-underline"
            target="_blank"
            rel="noopener"
          >
            Docs
          </a>
          <a
            href={BlogLink}
            target="_blank"
            rel="noopener"
            className="lg:px-4 text-base text-content-tertiary hover:text-content-primary hover:no-underline"
          >
            Blog
          </a>
          <a
            href="https://microchain.featurebase.app/"
            target="_blank"
            rel="noopener"
            className="lg:px-4 text-base text-content-tertiary hover:text-content-primary hover:no-underline"
          >
            Contact us
          </a>
        </div>
        <ModeToggle className="hidden" />
        <div className="flex gap-3 lg:gap-4 text-content-tertiary">
          <a href="https://github.com/mira-amm" target="_blank" rel="noopener">
            <GithubIcon />
          </a>
          <a href={DiscordLink} target="_blank" rel="noopener">
            <DiscordIcon />
          </a>
          <a href={XLink} target="_blank" rel="noopener">
            <XSocialIcon />
          </a>
        </div>
      </div>
      <div className="text-base text-center lg:text-right mt-[30px] text-content-tertiary/60">
        &copy; 2025 <BrandText microchain="Microchain" /> Finance
      </div>
    </footer>
  );
}
