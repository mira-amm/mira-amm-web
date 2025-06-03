import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {TextButton} from "./text-button";

const meta = {
  title: "🪙 Web/Text Button",
  component: TextButton,
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
} satisfies Meta<typeof TextButton>;

export default meta;
type Story = StoryObj<typeof TextButton>;

export const Default: Story = {
  args: {children: "Button"},
};
