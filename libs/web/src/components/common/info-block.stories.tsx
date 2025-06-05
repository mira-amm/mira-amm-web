import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {InfoBlock} from "./info-block";

const meta = {
  title: "🪙 Web/Trading & Swap/Info Block",
  component: InfoBlock,
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
} satisfies Meta<typeof InfoBlock>;

export default meta;
type Story = StoryObj<typeof InfoBlock>;

export const Default: Story = {
  args: {
    title: "TVL",
    value: "value",
    type: "positive",
  },
};
