import type {BaseLayoutProps} from "fumadocs-ui/layouts/shared";
import type {HomeLayoutProps} from "fumadocs-ui/layouts/home";

import Image from "next/image";
import {
  /* Figma as BrandIcon, */
  Rss as BlogIcon,
  Twitter,
} from "lucide-react";

import {AiOutlineDiscord as DiscordIcon} from "react-icons/ai";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Image
          src="/mira-logo.png"
          alt="Mira Logo Symbol"
          height={48}
          width={48}
        />
        <span className="text-lg font-bold text-lime-500">Mira Docs</span>
      </>
    ),
    url: "/",
  },
  links: [
    {
      text: "Swap",
      url: "https://mira.ly",
      external: true,
    },
    {
      text: "Architecture",
      url: "https://arch.mira.ly",
      external: true,
    },
    {
      text: "Graph",
      url: "https://graph.mira.ly",
      external: true,
    },
    {
      text: "Design",
      url: "https://design.mira.ly",
      external: true,
    },
    {
      type: "icon",
      text: "Blog",
      url: "https://mirror.xyz/miraly.eth",
      icon: <BlogIcon />,
      external: true,
    },
    {
      type: "icon",
      text: "Discord",
      url: "https://discord.gg/6pHdTY6rYq",
      external: true,
      icon: <DiscordIcon />,
    },
    {
      type: "icon",
      text: "X (Twitter)",
      url: "https://x.com/MiraProtocol",
      icon: <Twitter />,
      external: true,
    },
    /* {
     *   type: "icon",
     *   text: "Brand",
     *   url: "https://figma.com",
     *   external: true,
     *   icon: <BrandIcon />,
     * }, */
  ],
  githubUrl: "https://github.com/mira-amm/mira-amm-web",
};

export const homeOptions: HomeLayoutProps = {...baseOptions};
