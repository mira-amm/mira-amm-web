import type {Meta, StoryObj} from "@storybook/react";
import "../../../../styles.css";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import CoinPair from "./CoinPair";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Trading & Swap/Coin Pair",
  component: CoinPair,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="bg-background-primary p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof CoinPair>;

export default meta;
type Story = StoryObj<typeof CoinPair>;

export const Default: Story = {
  args: {
    firstCoin:
      "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b",
    secondCoin:
      "0xa0265fb5c32f6e8db3197af3c7eb05c48ae373605b8165b6f4a51c5b0ba4812e",
    isStablePool: true,
    withPoolDescription: true,
  },
};
