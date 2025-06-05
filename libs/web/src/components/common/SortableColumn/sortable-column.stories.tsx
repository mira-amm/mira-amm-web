import type {Meta, StoryObj} from "@storybook/react";
import "../../../../styles.css";
import SortableColumn from "./SortableColumn";

const meta = {
  title: "🪙 Web/Sortable Column",
  component: SortableColumn,
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
} satisfies Meta<typeof SortableColumn>;

export default meta;
type Story = StoryObj<typeof SortableColumn>;

export const Default: Story = {
  args: {
    title: "TVL",
    columnKey: "tvlUSD",
    orderBy: "tvlUSD_DESC",
    onSort: () => {},
  },
};
