import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {CoinWithAmount} from "./coin-with-amount";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Coin With Amount",
  component: CoinWithAmount,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="bg-[var(--background-primary)] p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof CoinWithAmount>;

export default meta;
type Story = StoryObj<typeof CoinWithAmount>;

export const Default: Story = {
  args: {
    assetId:
      "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
    amount: "10",
  },
};
export const WithName: Story = {
  args: {
    assetId:
      "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
    amount: "10",
    withName: true,
  },
};
