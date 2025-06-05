import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {InfoBlocks} from "./info-blocks";
import {RoadMapBlock} from "./roadmap-block";
import {RoadMapIcon} from "./roadmap-icon";

const meta = {
  title: "🪙 Web/Landing/Info Blocks",
  component: InfoBlocks,
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
} satisfies Meta<typeof InfoBlocks>;

export default meta;
type Story = StoryObj<typeof InfoBlocks>;

export const Default: Story = {
  args: {
    title: "block",
    children: [
      <RoadMapBlock
        logo={<RoadMapIcon text="Testnet" />}
        title="Basic AMM with volatile and stable swaps feature complete"
        description="July 2024"
        done
      />,
    ],
  },
};
