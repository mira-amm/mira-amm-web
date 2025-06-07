import type {Meta, StoryObj} from "@storybook/react";
import "../../../../styles.css";
import Pagination from "./Pagination";

const meta = {
  title: "🪙 Web/UI Components/Pagination",
  component: Pagination,
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
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {
    currentPage: 2,
    onChange: () => {},
    totalPages: 5,
  },
};
