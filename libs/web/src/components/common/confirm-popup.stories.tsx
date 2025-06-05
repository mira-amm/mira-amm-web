import type {Meta, StoryObj} from "@storybook/react";
import {ConfirmPopup} from ".";
import "../../../styles.css";

const meta: Meta<typeof ConfirmPopup> = {
  title: "🪙 Web/Modals & Popups/Confirm Popup",
  component: ConfirmPopup,
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
};

export default meta;
type Story = StoryObj<typeof ConfirmPopup>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: "Confirm Action",
    description: "Are you sure you want to proceed with this action?",
    onConfirm: () => console.log("Confirmed"),
    onCancel: () => console.log("Cancelled"),
  },
};

export const WithCustomButtons: Story = {
  args: {
    isOpen: true,
    title: "Custom Buttons",
    description: "This popup has custom button text",
    confirmText: "Yes, proceed",
    cancelText: "No, go back",
    onConfirm: () => console.log("Confirmed"),
    onCancel: () => console.log("Cancelled"),
  },
};
