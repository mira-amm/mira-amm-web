/* eslint-disable node/prefer-global/process */
import type { GlobalConfig } from "payload";

export const Github: GlobalConfig = {
  slug: "github",
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "text",
      type: "richText",
    },
    {
      name: "skills",
      type: "relationship",
      relationTo: "skills", // Joins with the Skills collection
      hasMany: false,
    },
    {
      name: "projects",
      type: "array",
      fields: [
        {
          name: "name",
          type: "text",
        },
        {
          name: "repoUrl",
          type: "text",
        },
        {
          name: "techStack",
          type: "relationship",
          relationTo: "brands", // Joins with brands (technologies)
          hasMany: true,
        },
      ],
    },
    {
      name: "githubStats",
      type: "group",
      fields: [
        {
          name: "totalRepos",
          type: "number",
        },
        {
          name: "totalCommits",
          type: "number",
        },
        {
          name: "followers",
          type: "number",
        },
        {
          name: "following",
          type: "number",
        },
        {
          name: "stars",
          type: "number",
        },
        {
          name: "forks",
          type: "number",
        },
      ],
    },
  ],
};
