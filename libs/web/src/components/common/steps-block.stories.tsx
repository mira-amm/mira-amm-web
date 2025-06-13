import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {StepsBlock} from "./steps-block";
import {StepsIcon} from "./steps-icon";
import {LockIcon} from "@/meshwave-ui/icons";

const meta = {
  title: "🪙 Web/Landing/Steps Block",
  component: StepsBlock,
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
} satisfies Meta<typeof StepsBlock>;

export default meta;
type Story = StoryObj<typeof StepsBlock>;

export const Default: Story = {
  args: {
    logo: <StepsIcon icon={<LockIcon />} />,
    title: "Lock",
    description: "MIRA can be locked in return for escrowed MIRA (veMIRA)",
  },
};
