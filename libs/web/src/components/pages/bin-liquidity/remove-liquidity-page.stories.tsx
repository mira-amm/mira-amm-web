import type {Meta, StoryObj} from "@storybook/react";
import "../../../../styles.css";
import "@/meshwave-ui/global.css";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {FuelProvider} from "@fuels/react";
import {defaultConnectors} from "@fuels/connectors";
import NewRemoveLiquidityPage from "./remove-bin-liquidity";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web / New Page / Remove Liquidity Page",
  component: NewRemoveLiquidityPage,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <FuelProvider
          fuelConfig={{connectors: defaultConnectors({devMode: true})}}
        >
          <div className="p-4">
            <Story />
          </div>
        </FuelProvider>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof NewRemoveLiquidityPage>;

export default meta;
type Story = StoryObj<typeof NewRemoveLiquidityPage>;

export const Default: Story = {
  args: {},
};
