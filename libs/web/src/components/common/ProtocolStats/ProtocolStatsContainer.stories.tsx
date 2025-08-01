import type {Meta, StoryObj} from "@storybook/react";
import {ProtocolStatsContainer} from "./ProtocolStatsContainer";
import type {ProtocolStatsData} from "../../../types/protocol-stats";

const meta: Meta<typeof ProtocolStatsContainer> = {
  title: "Components/ProtocolStats/ProtocolStatsContainer",
  component: ProtocolStatsContainer,
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

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Success: Story = {
  args: {
    data: mockStatsData,
    lastUpdated: new Date(),
    isLoading: false,
    isStale: false,
  },
};

export const SuccessStale: Story = {
  args: {
    data: mockStatsData,
    lastUpdated: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    isLoading: false,
    isStale: true,
  },
};

export const Error: Story = {
  args: {
    error: new Error(
      "Failed to fetch protocol statistics from GraphQL endpoint"
    ),
    isLoading: false,
    onRetry: () => console.log("Retry clicked"),
  },
};

export const ErrorWithStaleData: Story = {
  args: {
    data: mockStatsData,
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    error: new Error("GraphQL endpoint temporarily unavailable"),
    isLoading: false,
    isStale: true,
    onRetry: () => console.log("Retry clicked"),
  },
};
