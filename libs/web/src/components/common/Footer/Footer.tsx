import {FeatureGuard, Logo} from "@/src/components/common";
import {BlogLink, DiscordLink, XLink} from "@/src/utils/constants";
import {DiscordIcon, XSocialIcon, GithubIcon} from "@/meshwave-ui/icons";
import {Button} from "@/meshwave-ui/Button";
import {ModeToggle} from "@/src/components/common/toggle-mode";

export default function Footer() {
  return (
    <footer className="flex flex-col border-t border-white/10 box-border w-full py-4 px-4 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center lg:gap-[134px]">
        <Logo isFooter />
        <div className="flex gap-3 text-base leading-[22px] text-content-tertiary font-normal lg:w-[650px] lg:text-lg lg:leading-6">
          <Button
            asChild
            variant="link"
            className="text-content-tertiary hover:text-content-primary hover:no-underline"
          >
            <a href={DiscordLink}>Support</a>
          </Button>
          <Button
            asChild
            variant="link"
            className="text-content-tertiary hover:text-content-primary hover:no-underline"
          >
            <a
              href="https://docs.mira.ly/resources/security-audits"
              target="_blank"
            >
              Security Audit
            </a>
          </Button>
          <Button
            asChild
            variant="link"
            className="text-content-tertiary hover:text-content-primary hover:no-underline"
          >
            <a href="https://docs.mira.ly" target="_blank">
              Docs
            </a>
          </Button>
          <Button
            asChild
            variant="link"
            className="text-content-tertiary hover:text-content-primary hover:no-underline"
          >
            <a href={BlogLink} target="_blank">
              Blog
            </a>
          </Button>
          <Button
            asChild
            variant="link"
            className="text-content-tertiary hover:text-content-primary hover:no-underline"
          >
            <a href="mailto:help@mira.ly" target="_blank">
              Contact us
            </a>
          </Button>
        </div>
        <FeatureGuard>
          <ModeToggle />
        </FeatureGuard>
        <div className="flex gap-3 lg:gap-4">
          <a href="https://github.com/mira-amm" target="_blank" className="">
            <GithubIcon />
          </a>
          <a href={DiscordLink} target="_blank" className="">
            <DiscordIcon />
          </a>
          <a href={XLink} target="_blank" className="">
            <XSocialIcon />
          </a>
        </div>
      </div>
      <div className="text-sm text-center lg:text-right">
        &copy; 2025 Mira Finance
      </div>
    </footer>
  );
}
