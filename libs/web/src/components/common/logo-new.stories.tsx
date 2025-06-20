import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {LogoNew} from "./logo-new";

const meta = {
  title: "🪙 Web/UI Components/Logo New",
  component: LogoNew,
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
} satisfies Meta<typeof LogoNew>;

export default meta;
type Story = StoryObj<typeof LogoNew>;

export const Default: Story = {
  args: {},
};
