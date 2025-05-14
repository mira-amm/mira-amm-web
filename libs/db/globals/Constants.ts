/* eslint-disable node/prefer-global/process */
import type { GlobalConfig } from "payload";
import {
  isSuperAdmin,
} from "@/db/access";

import { navAccordions } from '@/db/collections/navAccordions'

export const Constants: GlobalConfig = {
  slug: "constants",
  access: {
    read: () => true,
    update: isSuperAdmin,
  },
  versions: {
    drafts: true,
  },
  admin: {
    group: navAccordions.globals,
    livePreview: {
      url: process.env.NODE_ENV === "development" ? 'http://localhost:8000' : 'https://microchain.systems',
      breakpoints: [
        {label: "Mobile", name: "mobile", width: 320, height: 568},
      ],
    },
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          name: "microgame",
          label: "🕹 Microgame",
          description: "Promotional minigame for the launch of Microchain.",
          fields: [
            {
              type: "tabs",
              tabs: [
                {
                  name: "login", label: "Login",
                  fields: [
                    {
                        name: "logo", type: "upload", relationTo: "media", label: "Logo",
                        // defaultValue: async ({ req }) => {
                        //   const media = await req.payload.find({
                        //     collection: "media",
                        //     where: {
                        //       filename: { equals: "cuHacking_2025_primary_logo.svg" }
                        //     }
                        //   });

                        //   return media?.docs?.[0]?.id || null;
                        // }
                      },
                    {
                      name: "text",
                      type: "array",
                      label: "Text",
                      fields: [
                        {name: "name", type: "text", label: "Name"},
                        {name: "text", type: "text", label: "Text"},
                      ],
                      defaultValue: () => [
                        { name: "title", text: "T-REX TECHNOLOGIES: DLM-2000 PROTOTYPE v0.8.5b" },
                        { name: "label", text: "T-REX SECURITY SYSTEM:" },
                        { name: "error", text: "SECURITY BREACH DETECTED. INVALID EXECUTIVE CREDENTIALS." },
                        { name: "hint", text: "HINT: The DLM-2000 infrastructure is built on this technology..." },
                      ],
                    },
                  ],
                },
                {
                  label: "Dashboard",
                  fields: [
                    {name: 'title', type: "text", defaultValue: () => "CEO ACCESS GRANTED - WELCOME TO DLM-2000, DEREK DINO"},
                    {name: 'lastLogin', type: "text", defaultValue: () => "> Last login: 4/20/2025, 10:15:19 PM on T-REX SECURE NETWORK"},
                    {name: 'welcome', type: "text", defaultValue: () => "Authentication successful. Welcome to MICROCHAIN SYSTEMS."},
                    {name: 'help', type: "text", defaultValue: () => "Type 'help' to see available commands."},
                    {name: 'optionsTitle', type: "text", defaultValue: () => "== EXECUTIVE COMMAND OPTIONS =="},
                    {
                      name: "options",
                      type: "array",
                      label: "Options",
                      fields: [
                        {name: "option", type: "text",},
                        {name: "description", type: "text"},
                      ],
                      defaultValue: () => [
                        {
                          option: "notes",
                          description: "Access confidential project files"
                        },
                        {
                          option: "timer",
                          description: "View DLM-2000 product launch countdown"
                        },
                        {
                          option: "game",
                          description: "Test the Decentralized Market Simulator"
                        },
                        {
                          option: "help",
                          description: "Show T-REX command options"
                        },
                        {
                          option: "clear",
                          description: "Purge screen data [CLASSIFIED]"
                        },
                        {
                          option: "logout",
                          description: "Engage T-REX security lockdown,"
                        },
                        {
                          option: "notes",
                          description: "Access confidential project files"
                        },
                      ],
                    },
                  ],
                },
                {
                  label: "Notes",
                  fields: [
                    {
                      name: "notes",
                      type: "array",
                      label: "Notes",
                      fields: [
                        {name: "title", type: "text",},
                        {name: "description", type: "text"},
                      ],
                      defaultValue: () => [
                        {
                          title: "MEMO DATE: 1985-03-12",
                          description: "President Reagan's Digital Assets Deregulation Act is working in our favor. The freedom to operate without government intervention gives us a clear advantage. The DLM-2000 prototype is progressing ahead of schedule. Fossil Frank has outdone himself again."
                        },
                        {
                          title: "MEMO DATE: 1985-06-24",
                          description: "Met with the Velociraptor hedge fund managers today. They're eager to be early adopters of the DLM-2000. Their aggressive trading style makes them perfect beta testers. Brian Bronto's connections continue to pay dividends - his disco-era networking is unmatched."
                        },
                        {
                          title: "MEMO DATE: 1985-09-18",
                          description: "Breakthrough on the permissionless trading algorithm! Our tests show zero slippage even with Brontosaurus-sized trades. This will revolutionize Wall Street. The traditional Dino exchanges won't know what hit them. Keeping this TOP SECRET until launch."
                        },
                        {
                          title: "MEMO DATE: 1985-11-03",
                          description: "URGENT: Possible corporate espionage detected. Suspicious T-Rex footprints found near R&D lab. Rival Dino firms getting desperate as our launch approaches. Implementing additional security protocols. TRUST NO ONE OUTSIDE THE CORE TEAM!"
                        },
                      ],
                    },
                  ],
                },
                {
                  label: "Game",
                  fields: [
                    {name: 'sectionTitle', type: "text", defaultValue: () => "DECENTRALIZED MARKET SIMULATOR"},
                    {name: 'subtitle', type: "text", defaultValue: () => "DLM-2000 PROTOTYPE TESTING ENVIRONMENT"},
                    {name: 'tradingInstructionsTitle', type: "text", defaultValue: () => "TRADING INSTRUCTIONS:"},
                    {
                      name: "instructions",
                      type: "array",
                      label: "Instructions",
                      fields: [
                        {name: "instruction", type: "text",},
                      ],
                      defaultValue: () => [
                        {instruction: "USE TRADING JOYSTICK TO NAVIGATE MARKETS",},
                        {instruction: "PRESS TRANSACTION BUTTON (SPACEBAR) TO EXECUTE TRADES",},
                        {instruction: "COLLECT BLOCKCHAIN ASSETS WHILE AVOIDING REGULATORY OBSTACLES",},
                        {instruction: "HIGHER SCORES EARN BETTER COMMISSION MULTIPLIERS!",},
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "💅 Assets",
          description: "Digital artwork & Logos.",
          fields: [],
        },
      ],
    },
  ],
};
