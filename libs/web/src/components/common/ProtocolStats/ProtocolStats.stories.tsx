import type {Meta, StoryObj} from "@storybook/react";
import {ProtocolStats} from "./ProtocolStats";
import type {ProtocolStatsData} from "../../../types/protocol-stats";

const meta: Meta<typeof ProtocolStats> = {
  title: "Components/ProtocolStats/ProtocolStats",
  component: ProtocolStats,
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

export const StaleData: Story = {
  args: {
    stats: mockStatsData,
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
