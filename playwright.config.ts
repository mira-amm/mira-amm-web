import type {SerenityOptions} from "@serenity-js/playwright-test";
/* eslint-disable node/prefer-global/process */
// import {fileURLToPath} from "node:url";
// import {workspaceRoot} from "@nx/devkit";
// import {nxE2EPreset} from "@nx/playwright/preset";

import {defineConfig, devices} from "@playwright/test";

// const __filename = fileURLToPath(import.meta.url);

const baseURL = "http://localhost:3000";

export default defineConfig<SerenityOptions>({
  testDir: "apps/web-e2e",
  // ...nxE2EPreset(__filename, {testDir: "./apps/web-e2e/src/"}),
  fullyParallel: !process.env.CI,
  workers: process.env.CI ? 2 : undefined,
  retries: 4,
  use: {
    crew: [
      ["@serenity-js/web:Photographer", {strategy: "TakePhotosOfFailures"}],
    ],
    defaultActorName: "User",
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    // cwd: workspaceRoot,
  },
  reporter: [
    [
      "@serenity-js/playwright-test",
      {
        crew: [
          "@serenity-js/console-reporter",
          "@serenity-js/serenity-bdd",
          [
            "@serenity-js/core:ArtifactArchiver",
            {outputDirectory: "target/site/serenity"},
          ],
        ],
      },
    ],
    ["html"],
  ],
  projects: [
    {
      name: "chromium",
      use: {...devices["Desktop Chrome"]},
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
