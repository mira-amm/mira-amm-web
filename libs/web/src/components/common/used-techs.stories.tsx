import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {UsedTechs} from "./used-techs";
import {FuelGroup} from "@/meshwave-ui/icons";

const meta = {
  title: "🪙 Web/Used Techs",
  component: UsedTechs,
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
} satisfies Meta<typeof UsedTechs>;

export default meta;
type Story = StoryObj<typeof UsedTechs>;

export const Default: Story = {
  args: {
    text: "Supported by",
    children: [
      <a
        href="https://fuel.network"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-2"
      >
        <FuelGroup />
      </a>,
    ],
    className: "",
  },
};
