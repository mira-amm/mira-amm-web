import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {SwapSuccessModal} from "./swap-success-modal";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Swap Success Modal",
  component: SwapSuccessModal,
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
} satisfies Meta<typeof SwapSuccessModal>;

export default meta;
type Story = StoryObj<typeof SwapSuccessModal>;

export const Default: Story = {
  args: {
    swapState: {
      sell: {
        assetId:
          "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
        amount: 10,
      },
      buy: {
        assetId:
          "0x1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82",
        amount: 10,
      },
    },
    transactionHash: "0x",
  },
};
