import type {Meta, StoryObj} from "@storybook/react";
import {StatCard} from "./StatCard";

const meta: Meta<typeof StatCard> = {
  title: "Components/ProtocolStats/StatCard",
  component: StatCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "The title/label for the stat",
    },
    value: {
      control: "number",
      description: "The numeric value to display",
    },
    formatAsCurrency: {
      control: "boolean",
      description: "Whether to format the value as currency",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Total TVL",
    value: 1234567.89,
    formatAsCurrency: true,
  },
};

export const LargeValue: Story = {
  args: {
    title: "All Time Volume",
    value: 123456789.12,
    formatAsCurrency: true,
  },
};

export const SmallValue: Story = {
  args: {
    title: "24H Volume",
    value: 12345.67,
    formatAsCurrency: true,
  },
};

export const NonCurrency: Story = {
  args: {
    title: "Active Pools",
    value: 42,
    formatAsCurrency: false,
  },
};

export const ZeroValue: Story = {
  args: {
    title: "New Pools",
    value: 0,
    formatAsCurrency: true,
  },
};

export const VeryLargeValue: Story = {
  args: {
    title: "Massive Volume",
    value: 1e18,
    formatAsCurrency: true,
  },
};
