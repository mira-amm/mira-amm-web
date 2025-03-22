/* eslint-disable node/prefer-global/process */
import type { GlobalConfig } from "payload";

const EMBED_URL = 'https://embed.figma.com/design/OOySUYRs2xEDJRMqY4bppf/MIRA-master-(shared)?node-id=13937-5016&embed-host=share'
const SHARE_URL = 'https://figma.com/design/OOySUYRs2xEDJRMqY4bppf/MIRA-master-(shared)?node-id=13937-5016&embed-host=share'

export const Design: GlobalConfig = {
  slug: "design",
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
