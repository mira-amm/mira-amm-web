import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {Info} from "./info";

const meta = {
  title: "🪙 Web/Info",
  component: Info,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="bg-background-primary p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Info>;

export default meta;
type Story = StoryObj<typeof Info>;

export const Default: Story = {
  args: {
    tooltipText: "text",
    tooltipKey: "key",
  },
};
