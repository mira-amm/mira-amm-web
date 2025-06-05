import type {Meta, StoryObj} from "@storybook/react";
import "../../../../styles.css";
import LoaderV2 from "./LoaderV2";

const meta = {
  title: "🪙 Web/Loader v2",
  component: LoaderV2,
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
} satisfies Meta<typeof LoaderV2>;

export default meta;
type Story = StoryObj<typeof LoaderV2>;

export const Default: Story = {
  args: {},
};
