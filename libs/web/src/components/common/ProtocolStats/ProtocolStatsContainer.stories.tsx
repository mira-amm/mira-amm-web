import type {Meta, StoryObj} from "@storybook/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ProtocolStatsContainer} from "./ProtocolStatsContainer";
import {useProtocolStats} from "../../../hooks/useProtocolStats";
import type {ProtocolStatsData} from "../../../types/protocol-stats";

// Mock the hook for Storybook
const mockUseProtocolStats = useProtocolStats as jest.MockedFunction<
  typeof useProtocolStats
>;

// Mock the hook module
jest.mock("../../../hooks/useProtocolStats");

const meta: Meta<typeof ProtocolStatsContainer> = {
  title: "Components/ProtocolStats/ProtocolStatsContainer",
  component: ProtocolStatsContainer,
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

export const Success: Story = {
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

export const Error: Story = {
  beforeEach: () => {
    mockUseProtocolStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error(
        "Failed to fetch protocol statistics from GraphQL endpoint"
      ),
      refetch: jest.fn(),
      isFetching: false,
    } as any);
  },
};

export const ErrorWithStaleData: Story = {
  beforeEach: () => {
    mockUseProtocolStats.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      isError: true,
      error: new Error("GraphQL endpoint temporarily unavailable"),
      refetch: jest.fn(),
      isFetching: false,
    } as any);
  },
};
