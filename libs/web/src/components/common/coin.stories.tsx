import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {Coin} from "./coin";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Coin",
  component: Coin,
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
} satisfies Meta<typeof Coin>;

export default meta;
type Story = StoryObj<typeof Coin>;

export const Default: Story = {
  args: {
    assetId:
      "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
  },
};
