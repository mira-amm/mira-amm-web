import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import { SkeletonLoader } from "./skeleton-loader";

const meta = {
  title: "🪙 Web/Skeleton Loader",
  component: SkeletonLoader,
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
} satisfies Meta<typeof SkeletonLoader>;

export default meta;
type Story = StoryObj<typeof SkeletonLoader>;

export const Default: Story = {
  args: {
    isLoading: true,
    count: 6,
    textLines: 2,
  },
};
