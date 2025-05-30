import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {Loader} from "./loader";

const meta = {
  title: "🪙 Web/Loader",
  component: Loader,
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
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof Loader>;

export const Default: Story = {
  args: {},
};
