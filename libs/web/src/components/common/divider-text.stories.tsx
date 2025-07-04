import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {DividerText} from "./divider-text";

const meta = {
  title: "🪙 Web/UI Components/Divider Text",
  component: DividerText,
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
} satisfies Meta<typeof DividerText>;

export default meta;
type Story = StoryObj<typeof DividerText>;

export const Default: Story = {
  args: {
    text: "text",
  },
};

export const DimmedText: Story = {
  args: {
    text: "text",
    dimmed: true,
  },
};
