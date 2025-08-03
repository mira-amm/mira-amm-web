import type {Meta, StoryObj} from "@storybook/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ProtocolStats} from "./ProtocolStats";
import {useProtocolStats} from "../../../hooks/useProtocolStats";
import type {ProtocolStatsData} from "../../../types/protocol-stats";

// Mock the hook for Storybook
const mockUseProtocolStats = useProtocolStats as jest.MockedFunction<
  typeof useProtocolStats
>;

// Mock the hook module
jest.mock("../../../hooks/useProtocolStats");

const meta: Meta<typeof ProtocolStats> = {
  title: "Components/ProtocolStats/ProtocolStats",
  component: ProtocolStats,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
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
  beforeEach: () => {
    mockUseProtocolStats.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    } as any);
  },
};

export const Loading: Story = {
  beforeEach: () => {
    mockUseProtocolStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: true,
    } as any);
  },
};

export const Error: Story = {
  beforeEach: () => {
    mockUseProtocolStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to fetch protocol stats"),
      refetch: jest.fn(),
      isFetching: false,
    } as any);
  },
};

export const LowValues: Story = {
  beforeEach: () => {
    mockUseProtocolStats.mockReturnValue({
      data: {
        allTimeVolume: 12345.67,
        totalTVL: 9876.54,
        oneDayVolume: 123.45,
        sevenDayVolume: 987.65,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    } as any);
  },
};

export const HighValues: Story = {
  beforeEach: () => {
    mockUseProtocolStats.mockReturnValue({
      data: {
        allTimeVolume: 1.23e12,
        totalTVL: 4.56e11,
        oneDayVolume: 7.89e9,
        sevenDayVolume: 1.23e10,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    } as any);
  },
};

export const ZeroValues: Story = {
  beforeEach: () => {
    mockUseProtocolStats.mockReturnValue({
      data: {
        allTimeVolume: 0,
        totalTVL: 0,
        oneDayVolume: 0,
        sevenDayVolume: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    } as any);
  },
};
