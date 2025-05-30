import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {Header} from "./header";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {FuelProvider} from "@fuels/react";
import {defaultConnectors} from "@fuels/connectors";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Header",
  component: Header,
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
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    pathName: "/",
  },
};
