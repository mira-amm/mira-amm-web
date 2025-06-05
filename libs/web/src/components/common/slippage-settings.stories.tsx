import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {SlippageSetting} from "./slippage-setting";

const meta = {
  title: "🪙 Web/Trading & Swap/Slippage Settings",
  component: SlippageSetting,
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
} satisfies Meta<typeof SlippageSetting>;

export default meta;
type Story = StoryObj<typeof SlippageSetting>;

export const Default: Story = {
  args: {
    slippage: 10,
    openSettingsModal: () => {},
  },
};
