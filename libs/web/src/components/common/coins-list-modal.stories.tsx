import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";

import {CoinsListModal} from "./coins-list-modal";
import {BN} from "fuels";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Coins List Modal",
  component: CoinsListModal,
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
} satisfies Meta<typeof CoinsListModal>;

export default meta;
type Story = StoryObj<typeof CoinsListModal>;

export const Default: Story = {
  args: {
    balances: [
      {
        assetId:
          "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
        amount: new BN(10),
      },
      {
        assetId:
          "0x0d9414fc8b98168c497a9ae2c3fb889aca17f03736cab8d797f674288ca7c0b3",
        amount: new BN(10),
      },
      {
        assetId:
          "0x1d29cedd3187e14e6ac9ce9b2beb4e00dc55ceab6f9ee8c2cb1278443c7c60b7",
        amount: new BN(10),
      },
      {
        assetId:
          "0x1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82",
        amount: new BN(10),
      },
      {
        assetId:
          "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b",
        amount: new BN(10),
      },
      {
        assetId:
          "0x328c708972bac378235bc5dcfc7e28e2da9ed2e41d6c1b9e8a6f8504a23b7c59",
        amount: new BN(10),
      },
      {
        assetId:
          "0x50bb4441ef4943d3b41b53d51cc598f0c3ddc578f66c7fa63892d7f6025240a4",
        amount: new BN(10),
      },
      {
        assetId:
          "0x725f6c22fa2bc2e7fd2bb1c3e6887ac52d3a8586aabcb586733175eab9870384",
        amount: new BN(10),
      },
      {
        assetId:
          "0x9e46f919fbf978f3cad7cd34cca982d5613af63ff8aab6c379e4faa179552958",
        amount: new BN(10),
      },
      {
        assetId:
          "0xa0265fb5c32f6e8db3197af3c7eb05c48ae373605b8165b6f4a51c5b0ba4812e",
        amount: new BN(10),
      },
      {
        assetId:
          "0xf3f9a0ed0ce8eac5f89d6b83e41b3848212d5b5f56108c54a205bb228ca30c16",
        amount: new BN(10),
      },
    ],
  },
};
