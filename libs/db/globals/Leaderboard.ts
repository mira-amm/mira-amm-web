import type {GlobalConfig} from "payload";
import {isSuperAdmin} from "@/db/access";
import {navAccordions} from "@/db/collections/navAccordions";

export const Leaderboard: GlobalConfig = {
  slug: "leaderboard",
  access: {
    read: () => true,
    update: isSuperAdmin,
  },
  admin: {
    group: navAccordions.globals,
  },
  fields: [
    {
      name: "entries",
      type: "array",
      label: "Leaderboard Entries",
      fields: [
        {
          name: "user",
          type: "relationship",
          relationTo: "users",
          required: true,
        },
        {
          name: "score",
          type: "number",
          required: true,
        },
        {
          name: "gameData",
          type: "json",
          required: false,
        },
      ],
    },
  ],
};
