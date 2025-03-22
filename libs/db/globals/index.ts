import type { GlobalConfig } from "payload";

export const App: GlobalConfig = {
  slug: "app",
  versions: {
    drafts: true,
  },
  admin: {
    livePreview: {
      url: process.env.NODE_ENV === "development" ? process.env.APP_LOCAL_URL : 'https://mira.ly',
      breakpoints: [
        {label: "Mobile", name: "mobile", width: 320, height: 568},
      ],
    },
  },
  fields: [
    {
      name: 'link',
      type: 'text',
      defaultValue: 'http://localhost:3000'
    }
  ],
};

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

const EMBED_URL = 'https://embed.figma.com/design/OOySUYRs2xEDJRMqY4bppf/MIRA-master-(shared)?node-id=13937-5016&embed-host=share'
const SHARE_URL = 'https://figma.com/design/OOySUYRs2xEDJRMqY4bppf/MIRA-master-(shared)?node-id=13937-5016&embed-host=share'

export const Figma: GlobalConfig = {
  slug: "figma",
  versions: {
    drafts: true,
  },
  admin: {
    livePreview: {
      url: EMBED_URL,
      breakpoints: [
        {label: "Mobile", name: "mobile", width: 320, height: 568},
      ],
    },
  },
  fields: [
    {
      name: 'embedLink',
      type: 'text',
      defaultValue: EMBED_URL
    },
    {
      name: 'shareLink',
      type: 'text',
      defaultValue: SHARE_URL
    }
  ],
};

export const Storybook: GlobalConfig = {
  slug: "storybook",
  versions: {
    drafts: true,
  },
  admin: {
    livePreview: {
      url: 'http://localhost:6006',
      breakpoints: [
        {label: "Mobile", name: "mobile", width: 320, height: 568},
      ],
    },
  },
  fields: [
    {
      name: 'link',
      type: 'text',
        defaultValue: 'http://localhost:6006'
    },
  ],
};

export const Graph: GlobalConfig = {
  slug: "graph",
  versions: {
    drafts: true,
  },
  admin: {
    livePreview: {
      url: 'http://localhost:4211/projects/all?groupByFolder=true',
      breakpoints: [
        {label: "Mobile", name: "mobile", width: 320, height: 568},
      ],
    },
  },
  fields: [
    {
      name: 'link',
      type: 'text',
        defaultValue: 'http://localhost:4211/projects/all?groupByFolder=true'
    },
  ],
};


export const DrizzleStudio: GlobalConfig = {
  slug: "drizzle-studio",
  versions: {
    drafts: true,
  },
  admin: {
    livePreview: {
      url: 'https://local.drizzle.studio',
      breakpoints: [
        {label: "Mobile", name: "mobile", width: 320, height: 568},
      ],
    },
  },
  fields: [
    {
      name: 'link',
      type: 'text',
      defaultValue: 'https://local.drizzle.studio'
    },
  ],
};


export const DatabaseSchema: GlobalConfig = {
  slug: "database-schema",
  versions: {
    drafts: true,
  },
  admin: {
    livePreview: {
      url: 'http://localhost:5600',
      breakpoints: [
        {label: "Mobile", name: "mobile", width: 320, height: 568},
      ],
    },
  },
  fields: [
    {
      name: 'link',
      type: 'text',
      defaultValue: 'http://localhost:5600'
    },
  ],
};
