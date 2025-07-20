import type {Meta, StoryObj} from "@storybook/react";
import {fn} from "storybook/test";
import {RainbowButton} from "./rainbow-button";
import {
  ChevronRightIcon,
  EnvelopeOpenIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";

const meta: Meta = {
  title: "🪄 Magic UI/Rainbow Button",
  component: RainbowButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "Rainbow Button",
    variant: "default",
    onClick: fn(),
  },
  argTypes: {
    variant: {
      options: ["default", "outline"],
      control: {type: "select"},
    },
    asChild: {
      control: {
        disable: true,
      },
    },
    size: {
      options: ["default", "sm", "lg", "icon"],
      control: {type: "select"},
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Outline: Story = {args: {variant: "outline"}};
export const Icon: Story = {
  args: {
    variant: "outline",
    size: "icon",
    children: <ChevronRightIcon className="size-4" />,
  },
  argTypes: {
    children: {control: {disable: true}},
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <EnvelopeOpenIcon className="mr-2 size-4" />
        Login with Email
      </>
    ),
  },
  argTypes: {
    children: {control: {disable: true}},
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <ReloadIcon className="mr-2 size-4 animate-spin" />
        Please wait
      </>
    ),
  },
  argTypes: {
    children: {control: {disable: true}},
  },
};
