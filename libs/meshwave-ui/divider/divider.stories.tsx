import type {Meta, StoryObj} from "@storybook/react";
import {Divider} from "./divider";

const meta = {
  title: "🪙 Meshwave UI/Divider",
  component: Divider,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="bg-background-primary p-4 w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const Dashed: Story = {
  args: {
    variant: "dashed",
  },
};

export const Dotted: Story = {
  args: {
    variant: "dotted",
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  decorators: [
    (Story) => (
      <div className="bg-background-primary p-4 h-32 flex items-center">
        <Story />
      </div>
    ),
  ],
};

export const WithContent: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-background-grey-dark rounded-ten">
        <h3 className="text-lg  mb-2">Coin Pair Section</h3>
        <p className="text-content-secondary">This is the coin pair content.</p>
      </div>

      <Divider />

      <div className="p-4 bg-background-grey-dark rounded-ten">
        <h3 className="text-lg  mb-2">Next Section</h3>
        <p className="text-content-secondary">
          This is the next section content.
        </p>
      </div>
    </div>
  ),
};
