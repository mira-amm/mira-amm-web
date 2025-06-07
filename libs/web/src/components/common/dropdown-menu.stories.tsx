import type {Meta, StoryObj} from "@storybook/react";
import "../../../styles.css";
import {DropDownMenu} from "./dropdown-menu";
import {CopyAddressIcon, TransactionsIcon} from "@/meshwave-ui/icons";

const meta = {
  title: "🪙 Web/Layout & Navigation/Dropdown menu",
  component: DropDownMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="bg-background-primary p-4 absolute top-0 -left-10 w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DropDownMenu>;

export default meta;
type Story = StoryObj<typeof DropDownMenu>;

export const Default: Story = {
  args: {
    buttons: [
      {
        icon: CopyAddressIcon,
        text: "Copy Address",
        onClick: () => {},
      },
      {
        text: "Transactions",
        onClick: () => {},
        icon: TransactionsIcon,
      },
    ],
  },
};
