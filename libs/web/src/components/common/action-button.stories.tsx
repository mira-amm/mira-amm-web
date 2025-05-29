import type { Meta, StoryObj } from "@storybook/react";
import { ActionButton } from ".";
import "../../../styles.css";

const meta = {
  title: "🪙 Web/Action Button",
  component: ActionButton,
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
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof ActionButton>;

export const Default: Story = {
  args: {
    children: "Click Me",
    onClick: () => console.log("Button clicked"),
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    disabled: true,
    onClick: () => console.log("Button clicked"),
  },
};

export const Loading: Story = {
  args: {
    children: "Loading...",
    loading: true,
    onClick: () => console.log("Button clicked"),
  },
};

export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
    onClick: () => console.log("Primary clicked"),
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
    onClick: () => console.log("Secondary clicked"),
  },
};

export const Outlined: Story = {
  args: {
    children: "Outlined Button",
    variant: "outlined",
    onClick: () => console.log("Outlined clicked"),
  },
};

export const FullWidth: Story = {
  args: {
    children: "Full Width Button",
    fullWidth: true,
    onClick: () => console.log("Full width clicked"),
  },
};

export const DisabledAndLoading: Story = {
  args: {
    children: "Processing...",
    disabled: true,
    loading: true,
    onClick: () => console.log("This shouldn't trigger"),
  },
};

export const Completed: Story = {
  args: {
    children: "Completed",
    completed: true,
    onClick: () => console.log("This shouldn't trigger"),
  },
};

export const CustomStyled: Story = {
  args: {
    children: "Custom Styled",
    className: "bg-red-500 text-white hover:bg-red-700",
    onClick: () => console.log("Custom styled clicked"),
  },
};
