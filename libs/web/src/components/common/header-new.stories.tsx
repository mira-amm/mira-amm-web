import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {FuelProvider} from "@fuels/react";
import {defaultConnectors} from "@fuels/connectors";
import {HeaderNew} from "./header-new";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Layout & Navigation/Header New",
  component: HeaderNew,
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
} satisfies Meta<typeof HeaderNew>;

export default meta;
type Story = StoryObj<typeof HeaderNew>;

export const Default: Story = {
  args: {
    pathName: "/",
  },
};
