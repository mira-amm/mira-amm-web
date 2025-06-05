import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {SearchBar} from "./search-bar";

const meta = {
  title: "🪙 Web/UI Components/SearchBar",
  component: SearchBar,
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
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {
  args: {
    placeholder: "Symbol or address...",
    onChange: () => {},
    inputRef: {},
    className: "",
    value: "",
  },
};
