import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {CopyNotification} from "./copy-notification";

const meta = {
  title: "🪙 Web/Loading & Feedback/Copy Notification",
  component: CopyNotification,
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
} satisfies Meta<typeof CopyNotification>;

export default meta;
type Story = StoryObj<typeof CopyNotification>;

export const Default: Story = {
  args: {},
};
