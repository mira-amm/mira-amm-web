import type {Meta, StoryObj} from "@storybook/react";
import Footer from "./Footer";

const meta: Meta<typeof Footer> = {
  title: "🪙 Web/Layout & Navigation/Footer",
  component: Footer,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background-primary">
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow" />
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  args: {},
};
