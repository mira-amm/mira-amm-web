import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {MainnetLabel} from "./mainnet-label";

const meta = {
  title: "🪙 Web/Mainnet Label",
  component: MainnetLabel,
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
} satisfies Meta<typeof MainnetLabel>;

export default meta;
type Story = StoryObj<typeof MainnetLabel>;

export const Default: Story = {
  args: {},
};
