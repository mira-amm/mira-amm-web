import Logo from "@/src/components/common/Logo/Logo";
import {BlogLink, DiscordLink, XLink} from "@/src/utils/constants";
import GithubIcon from "../../icons/GithubIcon";
import DiscordIcon from "../../icons/DiscordIcon";
import X from "../../icons/XSocialIcon";
import {Button} from "@/meshwave-ui/Button";

export default function Footer() {
  return (
    <footer className="flex flex-col text-[--content-dimmed-light] border-t border-white/10 box-border w-full py-4 px-4 max-w-6xl mx-auto gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center lg:gap-[134px]">
        <Logo />
        <div className="flex flex-col gap-3 text-base leading-[22px] text-[--content-primary] font-normal lg:flex-row lg:justify-between lg:w-[650px] lg:text-lg lg:leading-6">
          <Button
            asChild
            variant="link"
            className="text-[--content-primary] hover:text-[--content-dimmed-light]"
          >
            <a href={DiscordLink}>Support</a>
          </Button>
          <Button
            asChild
            variant="link"
            className="text-[--content-primary] hover:text-[--content-dimmed-light]"
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
            className="text-[--content-primary] hover:text-[--content-dimmed-light]"
          >
            <a href="https://docs.mira.ly" target="_blank">
              Docs
            </a>
          </Button>
          <Button
            asChild
            variant="link"
            className="text-[--content-primary] hover:text-[--content-dimmed-light]"
          >
            <a href={BlogLink} target="_blank">
              Blog
            </a>
          </Button>
          <Button
            asChild
            variant="link"
            className="text-[--content-primary] hover:text-[--content-dimmed-light]"
          >
            <a href="mailto:help@mira.ly" target="_blank">
              Contact us
            </a>
          </Button>
        </div>
        <div className="flex gap-3 lg:gap-4">
          <Button asChild variant="link" className="p-0 hover:opacity-65">
            <a href="https://github.com/mira-amm" target="_blank">
              <GithubIcon />
            </a>
          </Button>
          <Button asChild variant="link" className="p-0 hover:opacity-65">
            <a href={DiscordLink} target="_blank">
              <DiscordIcon />
            </a>
          </Button>
          <Button asChild variant="link" className="p-0 hover:opacity-65">
            <a href={XLink} target="_blank">
              <X />
            </a>
          </Button>
        </div>
      </div>
      <div className="text-sm text-center lg:text-right">
        &copy; 2025 Mira Finance
      </div>
    </footer>
  );
}
