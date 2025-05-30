import type {Meta, StoryObj} from "@storybook/react";
import {BackLink} from "./backlink";
import "../../../styles.css";

const meta = {
  title: "🪙 Web/Back link",
  component: BackLink,
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
} satisfies Meta<typeof BackLink>;

export default meta;
type Story = StoryObj<typeof BackLink>;

export const Default: Story = {
  args: {
    tile: "Back",
    onClick: () => console.log("Button clicked"),
  },
};
