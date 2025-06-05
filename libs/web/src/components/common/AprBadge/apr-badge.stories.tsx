import type {Meta, StoryObj} from "@storybook/react";
import "../../../../styles.css";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import AprBadge from "./AprBadge";
const queryClient = new QueryClient();

const meta = {
  title: "🪙 Web/Trading & Swap/Apr Badge",
  component: AprBadge,
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
} satisfies Meta<typeof AprBadge>;

export default meta;
type Story = StoryObj<typeof AprBadge>;

export const Default: Story = {
  args: {
    aprValue: "n/a",
    poolKey: "",
    tvlActual: 14763,
  },
};
