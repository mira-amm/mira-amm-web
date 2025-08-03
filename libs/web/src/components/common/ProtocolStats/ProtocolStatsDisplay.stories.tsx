import type {Meta, StoryObj} from "@storybook/react";
import {ProtocolStatsDisplay} from "./ProtocolStatsDisplay";
import type {ProtocolStatsData} from "../../../types/protocol-stats";

const meta: Meta<typeof ProtocolStatsDisplay> = {
  title: "Components/ProtocolStats/ProtocolStatsDisplay",
  component: ProtocolStatsDisplay,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStatsData: ProtocolStatsData = {
  allTimeVolume: 123456789.12,
  totalTVL: 45678901.23,
  oneDayVolume: 1234567.89,
  sevenDayVolume: 8765432.1,
};

export const Default: Story = {
  args: {
    stats: mockStatsData,
  },
};

export const Loading: Story = {
  args: {
    stats: mockStatsData,
    isLoading: true,
  },
};

export const NoData: Story = {
  args: {
    stats: undefined,
  },
};

export const LowValues: Story = {
  args: {
    stats: {
      allTimeVolume: 12345.67,
      totalTVL: 9876.54,
      oneDayVolume: 123.45,
      sevenDayVolume: 987.65,
    },
  },
};

export const HighValues: Story = {
  args: {
    stats: {
      allTimeVolume: 1.23e12,
      totalTVL: 4.56e11,
      oneDayVolume: 7.89e9,
      sevenDayVolume: 1.23e10,
    },
  },
};

export const ZeroValues: Story = {
  args: {
    stats: {
      allTimeVolume: 0,
      totalTVL: 0,
      oneDayVolume: 0,
      sevenDayVolume: 0,
    },
  },
};

export const WithCustomClassName: Story = {
  args: {
    stats: mockStatsData,
    className: "bg-gray-50 p-4 rounded-lg",
  },
};
