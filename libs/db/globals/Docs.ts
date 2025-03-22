/* eslint-disable node/prefer-global/process */
import type { GlobalConfig } from "payload";

export const Docs: GlobalConfig = {
  slug: "docs",
  versions: {
    drafts: true,
  },
  admin: {
    livePreview: {
      url: process.env.NODE_ENV === "development" ? process.env.DOCS_LOCAL_URL : 'https://docs.mira.ly',
      breakpoints: [
        {label: "Mobile", name: "mobile", width: 320, height: 568},
      ],
    },
  },
  fields: [
    {
      name: 'blog',
      type: 'text',
      defaultValue: 'https://mirror.xyz/miraly.eth'
    },
    {
      name: 'discord',
      type: 'text',
      defaultValue: 'https://discord.gg/6pHdTY6rYq'
    },
    {
      name: 'x',
      type: 'text',
      defaultValue: 'https://x.com/MiraProtocol'
    },
    {
      name: 'instagram',
      type: 'text',
      defaultValue: 'https://instagram.com'
    },
    {
      name: 'facebook',
      type: 'text',
      defaultValue: 'https://facebook.com'
    },
    {
      name: 'github',
      type: 'text',
      defaultValue: 'https://github.com/mira-amm'
    },
  ],
};
