import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {LaunchAppButton} from "./launch-app-button";

const meta = {
  title: "🪙 Web/Launch App Button",
  component: LaunchAppButton,
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
} satisfies Meta<typeof LaunchAppButton>;

export default meta;
type Story = StoryObj<typeof LaunchAppButton>;

export const Default: Story = {
  args: {
    route: [""],
  },
};
