import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {RoadMapBlock} from "./roadmap-block";
import {RoadMapIcon} from "./roadmap-icon";

const meta = {
  title: "🪙 Web/Landing/RoadMap Block",
  component: RoadMapBlock,
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
} satisfies Meta<typeof RoadMapBlock>;

export default meta;
type Story = StoryObj<typeof RoadMapBlock>;

export const Default: Story = {
  args: {
    logo: <RoadMapIcon text="Testnet" />,
    title: "Basic AMM with volatile and stable swaps feature complete",
    description: "July 2024",
    done: true,
  },
};
