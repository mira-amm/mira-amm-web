import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {StepsIcon} from "./steps-icon";
import {LockIcon} from "@/meshwave-ui/icons";

const meta = {
  title: "🪙 Web/Steps Icon",
  component: StepsIcon,
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
} satisfies Meta<typeof StepsIcon>;

export default meta;
type Story = StoryObj<typeof StepsIcon>;

export const Default: Story = {
  args: {
    icon: <LockIcon />,
  },
};
