import type {Meta, StoryObj} from "@storybook/react";
import "../../../../styles.css";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {FuelProvider} from "@fuels/react";
import {defaultConnectors} from "@fuels/connectors";
import Swap from "./Swap";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Swap",
  component: Swap,
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
          <div className="bg-background-primary p-4">
            <Story />
          </div>
        </FuelProvider>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof Swap>;

export default meta;
type Story = StoryObj<typeof Swap>;

export const Default: Story = {
  args: {},
};
