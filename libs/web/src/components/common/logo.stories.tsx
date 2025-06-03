import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {Logo} from "./logo";

const meta = {
  title: "🪙 Web/Logo",
  component: Logo,
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
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  args: {},
};
