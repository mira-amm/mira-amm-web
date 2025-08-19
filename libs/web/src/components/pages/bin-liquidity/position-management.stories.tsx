import type {Meta, StoryObj} from "@storybook/react";
import "../../../../styles.css";
import "@/meshwave-ui/global.css";
import NewPositionManagementPage from "./position-management";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {FuelProvider} from "@fuels/react";
import {defaultConnectors} from "@fuels/connectors";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web / New Page / Position Management Page",
  component: NewPositionManagementPage,
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
} satisfies Meta<typeof NewPositionManagementPage>;

export default meta;
type Story = StoryObj<typeof NewPositionManagementPage>;

export const Default: Story = {
  args: {},
};
