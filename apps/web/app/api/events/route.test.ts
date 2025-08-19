import {describe, it, expect, vi, afterEach} from "vitest";
import {NextRequest} from "next/server";
import {request, gql} from "graphql-request";
import {GET} from "./route";
import {SQDIndexerUrl} from "../../../../../libs/web/src/utils/constants";
import type {SpyInstance} from "vitest";

vi.mock("../../../../../libs/web/src/utils/constants", () => ({
  SQDIndexerUrl: "https://mock-squid-indexer.com",
}));

vi.mock("graphql-request", () => ({
  request: vi.fn(),
  gql: vi.fn((query: string) => "dummy_query"),
}));

describe("GET /api/events", () => {
  const mockRequest = request as SpyInstance;

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if fromBlock or toBlock is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events/?fromBlock=100"
    ); // Missing toBlock

    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "'fromBlock' and 'toBlock' must be valid and ordered",
    });
  });

  it("should return 200 with events for the given block range", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events/?fromBlock=100&toBlock=200"
    );

    const mockActions = {
      actions: [
        {
          pool: {id: "pool1"},
          asset0: {id: "asset0", decimals: 6},
          asset1: {id: "asset1", decimals: 9},
          amount1Out: "1000",
          amount1In: "0",
          amount0Out: "0",
          amount0In: "500",
          reserves0After: "1000",
          reserves1After: "2001",
          type: "ADD_LIQUIDITY",
          transaction: "txn1",
          recipient: "recipient_address1",
          timestamp: 1234567890,
          blockNumber: 1,
        },
        {
          pool: {id: "pool2"},
          asset0: {id: "asset0", decimals: 9},
          asset1: {id: "asset1", decimals: 9},
          amount1Out: "1001",
          amount1In: "0",
          amount0Out: "0",
          amount0In: "300",
          reserves0After: "2000",
          reserves1After: "4000",
          type: "SWAP",
          transaction: "txn2",
          recipient: "recipient_address2",
          timestamp: 1234567891,
          blockNumber: 2,
        },
      ],
    };

    mockRequest.mockResolvedValueOnce(mockActions);

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json).toEqual({
      events: [
        {
          block: {blockNumber: 1, blockTimestamp: 1234567890},
          txnId: "txn1",
          txnIndex: 0,
          eventIndex: 0,
          maker: "recipient_address1",
          pairId: "pool1",
          reserves: {asset0: "0.001000", asset1: "0.000002001"},
          eventType: "join",
          amount0: "0.000500",
          amount1: "0.000000000",
        },
        {
          block: {blockNumber: 2, blockTimestamp: 1234567891},
          txnId: "txn2",
          txnIndex: 0,
          eventIndex: 0,
          maker: "recipient_address2",
          pairId: "pool2",
          reserves: {asset0: "0.000002000", asset1: "0.000004000"},
          eventType: "swap",
          asset0In: "0.000000300",
          asset1Out: "0.000001001",
          priceNative: 0.29970029970029965,
        },
      ],
    });

    expect(mockRequest).toHaveBeenCalledWith({
      url: SQDIndexerUrl,
      document: "dummy_query",
      variables: {fromBlock: 100, toBlock: 200},
    });
  });

  it("should return an empty events array if no actions are found", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events/?fromBlock=100&toBlock=200"
    );

    mockRequest.mockResolvedValueOnce({actions: []});

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({events: []});
  });

  it("should return a 500 error if there is an exception", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events/?fromBlock=100&toBlock=200"
    );

    mockRequest.mockRejectedValueOnce(new Error("Network error"));

    const res = await GET(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "Failed to fetch events data",
    });
  });

  describe("Binned Liquidity Compatibility", () => {
    it("should handle binned liquidity MINT_LIQUIDITY events while maintaining compatibility", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/events/?fromBlock=100&toBlock=200"
      );

      const mockBinnedLiquidityActions = {
        actions: [
          {
            pool: {id: "binned_pool1", binStep: 100, activeId: 8388608},
            asset0: {id: "asset_x", decimals: 18},
            asset1: {id: "asset_y", decimals: 18},
            amount1Out: "0", // Traditional fields for backward compatibility
            amount1In: "0",
            amount0Out: "0",
            amount0In: "0",
            reserves0After: "1000000000000000000",
            reserves1After: "2000000000000000000",
            type: "MINT_LIQUIDITY",
            transaction: "binned_txn1",
            recipient: "recipient_address1",
            sender: "sender_address1",
            timestamp: 1234567890,
            blockNumber: 1,
            // Binned liquidity specific fields
            binId: 8388608,
            binIds: [8388607, 8388608, 8388609],
            amounts: [
              { x: "100000000000000000", y: "200000000000000000" },
              { x: "150000000000000000", y: "300000000000000000" },
              { x: "50000000000000000", y: "100000000000000000" }
            ],
            lpTokenMinted: "lp_token_asset_id",
            totalFees: { x: "1000000000000000", y: "2000000000000000" },
            protocolFees: { x: "250000000000000", y: "500000000000000" }
          }
        ],
      };

      mockRequest.mockResolvedValueOnce(mockBinnedLiquidityActions);

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.events).toHaveLength(1);
      const event = json.events[0];
      
      // Should maintain traditional event structure for backward compatibility
      expect(event.eventType).toBe("mint_liquidity");
      expect(event.txnId).toBe("binned_txn1");
      expect(event.maker).toBe("sender_address1"); // Should use sender for binned liquidity
      expect(event.pairId).toBe("binned_pool1");
      
      // Should aggregate amounts from all bins
      expect(event.amount0).toBe("0.3"); // Sum of x amounts: 0.1 + 0.15 + 0.05
      expect(event.amount1).toBe("0.6"); // Sum of y amounts: 0.2 + 0.3 + 0.1
      
      // Should include binned metadata
      expect(event.binnedMetadata).toBeDefined();
      expect(event.binnedMetadata.binId).toBe(8388608);
      expect(event.binnedMetadata.binStep).toBe(100);
      expect(event.binnedMetadata.lpTokenMinted).toBe("lp_token_asset_id");
    });

    it("should handle binned liquidity SWAP events while maintaining compatibility", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/events/?fromBlock=100&toBlock=200"
      );

      const mockBinnedSwapActions = {
        actions: [
          {
            pool: {id: "binned_pool2", binStep: 50, activeId: 8388610},
            asset0: {id: "asset_x", decimals: 18},
            asset1: {id: "asset_y", decimals: 18},
            amount1Out: "0", // Traditional fields for backward compatibility
            amount1In: "0",
            amount0Out: "0",
            amount0In: "0",
            reserves0After: "5000000000000000000",
            reserves1After: "10000000000000000000",
            type: "SWAP",
            transaction: "binned_swap_txn1",
            recipient: "recipient_address1",
            sender: "sender_address1",
            timestamp: 1234567891,
            blockNumber: 2,
            // Binned liquidity specific fields
            binId: 8388610,
            amountsIn: { x: "1000000000000000000", y: "0" }, // 1.0 token X in
            amountsOut: { x: "0", y: "950000000000000000" }, // 0.95 token Y out
            totalFees: { x: "5000000000000000", y: "0" },
            protocolFees: { x: "1250000000000000", y: "0" }
          }
        ],
      };

      mockRequest.mockResolvedValueOnce(mockBinnedSwapActions);

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.events).toHaveLength(1);
      const event = json.events[0];
      
      // Should maintain traditional swap event structure
      expect(event.eventType).toBe("swap");
      expect(event.asset0In).toBe("1.0");
      expect(event.asset1Out).toBe("0.95");
      expect(event.priceNative).toBe(1.0526315789473684); // 1.0 / 0.95
      
      // Should include binned metadata
      expect(event.binnedMetadata).toBeDefined();
      expect(event.binnedMetadata.binId).toBe(8388610);
      expect(event.binnedMetadata.totalFees).toEqual({ x: "5000000000000000", y: "0" });
    });

    it("should handle traditional AMM events without binned metadata", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/events/?fromBlock=100&toBlock=200"
      );

      const mockTraditionalActions = {
        actions: [
          {
            pool: {id: "traditional_pool1"},
            asset0: {id: "asset0", decimals: 18},
            asset1: {id: "asset1", decimals: 18},
            amount1Out: "1000000000000000000",
            amount1In: "0",
            amount0Out: "0",
            amount0In: "500000000000000000",
            reserves0After: "10000000000000000000",
            reserves1After: "20000000000000000000",
            type: "SWAP",
            transaction: "traditional_txn1",
            recipient: "recipient_address1",
            timestamp: 1234567890,
            blockNumber: 1,
            // No binned liquidity fields
          }
        ],
      };

      mockRequest.mockResolvedValueOnce(mockTraditionalActions);

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.events).toHaveLength(1);
      const event = json.events[0];
      
      // Should work exactly as before for traditional AMM
      expect(event.eventType).toBe("swap");
      expect(event.asset0In).toBe("0.5");
      expect(event.asset1Out).toBe("1.0");
      expect(event.priceNative).toBe(0.5);
      expect(event.maker).toBe("recipient_address1"); // Should use recipient for traditional
      
      // Should not include binned metadata
      expect(event.binnedMetadata).toBeUndefined();
    });
  });
});
