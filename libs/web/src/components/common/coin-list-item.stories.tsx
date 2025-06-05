import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {CoinListItem} from "./coin-list-item";
import {BN} from "fuels";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Trading & Swap/Coin List Item",
  component: CoinListItem,
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
} satisfies Meta<typeof CoinListItem>;

export default meta;
type Story = StoryObj<typeof CoinListItem>;

export const Default: Story = {
  args: {
    assetData: {
      assetId:
        "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
      name: "Ethereum",
      symbol: "ETH",
      decimals: 9,
      icon: "https://verified-assets.fuel.network/images/eth.svg",
      l1Address: null,
      contractId: null,
      subId: null,
      price: "2658.943019339",
      isVerified: true,
      userBalance: {
        assetId:
          "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
        amount: new BN(10),
      },
    },
  },
};
