import type {Meta, StoryObj} from "@storybook/react";
import "../../../../styles.css";

import DisconnectMobile from "./DisconnectMobile";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {FuelProvider} from "@fuels/react";
import {defaultConnectors} from "@fuels/connectors";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Disconnect Mobile",
  component: DisconnectMobile,
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
} satisfies Meta<typeof DisconnectMobile>;

export default meta;
type Story = StoryObj<typeof DisconnectMobile>;

export const Default: Story = {
  args: {},
};
