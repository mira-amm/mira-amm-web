import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {RoadMapIcon} from "./roadmap-icon";

const meta = {
  title: "🪙 Web/Road Map Icon",
  component: RoadMapIcon,
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
} satisfies Meta<typeof RoadMapIcon>;

export default meta;
type Story = StoryObj<typeof RoadMapIcon>;

export const Default: Story = {
  args: {
    text: "Testnet",
  },
};
