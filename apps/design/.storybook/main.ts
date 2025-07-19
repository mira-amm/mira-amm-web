import type {StorybookConfig} from "@storybook/nextjs";

import {TsconfigPathsPlugin} from "tsconfig-paths-webpack-plugin";

export default {
  stories: [
    "../*.@(mdx|stories.@(ts|tsx))",
    "../../../libs/meshwave-ui/**/*.@(mdx|stories.@(ts|tsx))",
    "../../../libs/web/**/*.@(mdx|stories.@(ts|tsx))",
    "../../../libs/shared/ui/**/*.@(mdx|stories.@(ts|tsx))",
    "../../../libs/external/**/*.@(mdx|stories.@(ts|tsx))",
  ],
  staticDirs: [
    // './public',
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  docs: {},
  // Did not use @storybook/addon-essentials due to lack of toolbar ordering API
  addons: [
    // Person inside circle icon. Also 'Accessibility' tab to action bar
    "storybook-dark-mode",
    "@storybook/addon-themes",
    "@storybook/addon-a11y", //   name: '@storybook/addon-storysource',
    {
      name: "@storybook/addon-designs", // Actually has amazing docs for once: https://storybookjs.github.io/addon-designs/?path=/docs/docs-quick-start--docs
      options: {
        // renderTarget: 'canvas' | 'tab'
      },
    }, //   options: {
    //     rule: {
    //       test: [/\.stories\.tsx?$/],
    //       include: [path.resolve(__dirname, '../src')], // You can specify directories
    //     },
    //     loaderOptions: {
    //       parser: 'typescript',
    //       injectStoryParameters: false,
    //       prettierConfig: { printWidth: 80, singleQuote: false },
    //     },
    //     enforce: 'pre',
    //   },
    // },
    // --------------- No-icons ---------------
    // Onboarding flow
    // '@storybook/addon-onboarding',
    // Custom toolbars
    "@storybook/addon-links", // 'storybook/internal/toolbars',
    // Auto-generate MDX/React/JSX documentation for components
    // https://github.com/storybookjs/storybook/tree/next/code/addons/docs
    // HTML Tab in action bar
    // https://github.com/whitespace-se/storybook-addon-html
    // https://github.com/simeonc/storybook-xstate-addon
    // "storybook-xstate-addon/preset" // waiting on xstate v5 & storybook v8 support
    {
      name: "@storybook/addon-docs",
      options: {
        // csfPluginOptions: null,
        // mdxPluginOptions: {
        //   mdxCompileOptions: {
        //     remarkPlugins: [],
        //   },
        // },
        sourceLoaderOptions: {
          injectStoryParameters: false,
        },
      },
    },
    "@whitespace/storybook-addon-html",
  ],
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.plugins = [
        ...(config.resolve.plugins || []),
        new TsconfigPathsPlugin({
          // configFile: "./.storybook/tsconfig.storybook.json",
          configFile: "../../tsconfig.base.json",
        }),
      ];
    }

    return config;
  },
} satisfies StorybookConfig;
