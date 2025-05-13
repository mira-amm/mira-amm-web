import type {GlobalConfig} from "payload";
import {navAccordions} from "@/db/collections/navAccordions";

export const Leaderboards: GlobalConfig = {
  slug: "leaderboards",
  access: {
    read: () => true,
  },
  admin: {
    group: navAccordions.categories,
  },
  fields: [
        {
          name: "list",
          type: "join",
          collection: "games",
          on: "player",
        },
  ],
};
