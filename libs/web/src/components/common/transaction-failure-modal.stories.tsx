import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {TransactionFailureModal} from "./transaction-failure-modal";

const meta = {
  title: "🪙 Web/Transaction Failure Modal",
  component: TransactionFailureModal,
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
} satisfies Meta<typeof TransactionFailureModal>;

export default meta;
type Story = StoryObj<typeof TransactionFailureModal>;

export const Default: Story = {
  args: {closeModal: () => {}},
};
