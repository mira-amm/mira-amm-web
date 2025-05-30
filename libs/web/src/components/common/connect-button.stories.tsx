import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {ConnectButton} from "./connect-button";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {FuelProvider} from "@fuels/react";
import {defaultConnectors} from "@fuels/connectors";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Connect Button",
  component: ConnectButton,
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
          <div className="bg-[var(--background-primary)] p-4">
            <Story />
          </div>
        </FuelProvider>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof ConnectButton>;

export default meta;
type Story = StoryObj<typeof ConnectButton>;

export const Default: Story = {
  args: {},
};
