import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {MainInfo} from "./main-info";
import {InfoBlocks} from "./info-blocks";
import {RoadMapBlock} from "./roadmap-block";
import {RoadMapIcon} from "./roadmap-icon";

const meta = {
  title: "🪙 Web/Main Info",
  component: MainInfo,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="bg-[var(--background-primary)] p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MainInfo>;

export default meta;
type Story = StoryObj<typeof MainInfo>;

export const Default: Story = {
  args: {
    title: "MIRA's Roadma",
    description: "Join us in on a journey to the future of the internet",
    children: [
      <InfoBlocks>
        <RoadMapBlock
          logo={<RoadMapIcon text="Testnet" />}
          title="Basic AMM with volatile and stable swaps feature complete"
          description="July 2024"
          done
        />
      </InfoBlocks>,
    ],
    link: "Swap",
  },
};
