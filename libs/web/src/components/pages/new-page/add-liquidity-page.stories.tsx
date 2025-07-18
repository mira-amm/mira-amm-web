import type {Meta, StoryObj} from "@storybook/react";
import "../../../../styles.css";
import "@/meshwave-ui/global.css";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {FuelProvider} from "@fuels/react";
import {defaultConnectors} from "@fuels/connectors";
import NewAddLiquidityPage from "./add-liquidity-page";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web / New Page / Add Liquidity Page",
  component: NewAddLiquidityPage,
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
} satisfies Meta<typeof NewAddLiquidityPage>;

export default meta;
type Story = StoryObj<typeof NewAddLiquidityPage>;

export const Default: Story = {
  args: {},
};
