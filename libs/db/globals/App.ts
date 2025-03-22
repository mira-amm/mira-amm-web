/* eslint-disable node/prefer-global/process */
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
      name: 'text',
      type: 'text'
    }
  ],
};
