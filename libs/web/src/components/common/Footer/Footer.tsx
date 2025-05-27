import Logo from "@/src/components/common/Logo/Logo";
import { BlogLink, DiscordLink, XLink } from "@/src/utils/constants";
import GithubIcon from "../../icons/Github/GithubIcon";
import DiscordIcon from "../../icons/DiscordIcon/DiscordIcon";
import X from "../../icons/X/XSocialIcon";

export default function Footer() {
  return (
    <footer className="flex flex-col text-[--content-dimmed-light] border-t border-white/10 box-border w-full py-4 px-4 max-w-6xl mx-auto gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center lg:gap-[134px]">
        <Logo />
        <div className="flex flex-col gap-3 text-base leading-[22px] text-[--content-primary] font-normal lg:flex-row lg:justify-between lg:w-[650px] lg:text-lg lg:leading-6">
          <a className="transition-colors duration-300 hover:text-[--content-dimmed-light]" href={DiscordLink}>Support</a>
          <a className="transition-colors duration-300 hover:text-[--content-dimmed-light]" href="https://docs.mira.ly/developer-guides/security-audit" target="_blank">Security Audit</a>
          <a className="transition-colors duration-300 hover:text-[--content-dimmed-light]" href="https://docs.mira.ly" target="_blank">Docs</a>
          <a className="transition-colors duration-300 hover:text-[--content-dimmed-light]" href={BlogLink} target="_blank">Blog</a>
          <a className="transition-colors duration-300 hover:text-[--content-dimmed-light]" href="mailto:help@mira.ly" target="_blank">Contact us</a>
        </div>
        <div className="flex gap-3 lg:gap-4">
          <a className="transition-opacity duration-300 hover:opacity-65" href="https://github.com/mira-amm" target="_blank"><GithubIcon /></a>
          <a className="transition-opacity duration-300 hover:opacity-65" href={DiscordLink} target="_blank"><DiscordIcon /></a>
          <a className="transition-opacity duration-300 hover:opacity-65" href={XLink} target="_blank"><X /></a>
        </div>
      </div>
      <div className="text-sm text-center lg:text-right">
        &copy; 2025 Mira Finance
      </div>
    </footer>
  );
}
