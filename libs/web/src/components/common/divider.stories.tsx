import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {Divider} from "./divider";

const meta = {
  title: "🪙 Web/Divider",
  component: Divider,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="bg-[var(--background-primary)] p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {
  args: {
    text: "text",
  },
};

export const DimmedText: Story = {
  args: {
    text: "text",
    dimmed: true,
  },
};
