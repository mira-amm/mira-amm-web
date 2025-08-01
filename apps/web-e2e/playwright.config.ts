/* eslint-disable node/prefer-global/process */
import type { SerenityFixtures, SerenityWorkerFixtures } from '@serenity-js/playwright-test'
import {fileURLToPath} from "node:url";
import {workspaceRoot} from "@nx/devkit";
import {nxE2EPreset} from "@nx/playwright/preset";

import {defineConfig, devices} from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);

const baseURL = "http://localhost:3000";

export default defineConfig<SerenityFixtures, SerenityWorkerFixtures>({
  ...nxE2EPreset(__filename, {testDir: "./src"}),
  fullyParallel: true,
  workers: "90%",
  retries: 4,
  forbidOnly: !process.env.CI,
  webServer: {
    command: "nx start web",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    cwd: workspaceRoot,
    timeout: 1000 * 60 * 6, // 1000 ms * 60 * 6 = 6 minutes
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
      use: {
        channel: 'chromium',
        // ...devices["Desktop Chrome"],
        launchOptions: {
          args: [
            // "--no-sandbox",
            '--disable-features=ExtensionDisableUnsupportedDeveloper',
            ...(process.platform === "linux" && !process.env.CI ? [
            "--use-angle=vulkan",
            "--enable-features=Vulkan",
            "--disable-vulkan-surface",
            "--enable-unsafe-webgpu",
            ] : []),
          ],
        },
      crew: [
        ["@serenity-js/web:Photographer", {strategy: "TakePhotosOfFailures"}],
      ],
      baseURL,
      trace: "on-first-retry",
      permissions: ['clipboard-read', 'clipboard-write'],
      actionTimeout: 5000,
      screenshot: 'only-on-failure',
      },
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
