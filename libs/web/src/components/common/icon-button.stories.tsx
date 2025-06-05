import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {IconButton} from "./icon-button";

const meta = {
  title: "🪙 Web/UI Components/Icon Button",
  component: IconButton,
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
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: {
    children: "button",
  },
};
