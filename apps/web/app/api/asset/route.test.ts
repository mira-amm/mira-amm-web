import {describe, it, expect, vi, beforeAll, afterAll} from "vitest";
import {NextRequest} from "next/server";
import {GET} from "./route";

const mockMainnetUrl = "https://mock-mainnet-explorer.fuel.network";
const mockAssetId = "123456";
const mockAssetData = {
  assetId: mockAssetId,
  name: "Mock Asset",
  symbol: "MCK",
  decimals: 18,
  totalSupply: "1000000000000000000",
  circulatingSupply: "500000000000000000",
};

vi.mock("../../../../../libs/web/src/utils/constants", () => ({
  MainnetUrl: mockMainnetUrl,
}));

describe("GET /api/asset", () => {
  let originalFetch: typeof global.fetch;
  const mockFetch = vi.fn();

  beforeAll(() => {
    // Swap in our fetch spy
    originalFetch = global.fetch;
    // @ts-expect-error override
    global.fetch = mockFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should return 400 if 'id' query parameter is missing", async () => {
    const req = new NextRequest("https://mock-api.com/api/asset");
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({error: "Asset ID is required"});
  });

  it("should return 404 if the asset is not found", async () => {
    mockFetch.mockResolvedValueOnce({ok: false, status: 404} as Response);

    const req = new NextRequest(
      `https://mock-api.com/api/asset?id=${mockAssetId}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: `Asset with ID: ${mockAssetId} not found`,
    });
  });

  it("should return 500 if there is an error fetching asset data", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const req = new NextRequest(
      `https://mock-api.com/api/asset?id=${mockAssetId}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({error: "Failed to fetch asset data"});
  });

  it("should return 200 with transformed asset data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce(mockAssetData),
    } as Response);

    const req = new NextRequest(
      `https://mock-api.com/api/asset?id=${mockAssetId}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      asset: {
        id: mockAssetData.assetId,
        name: mockAssetData.name,
        symbol: mockAssetData.symbol,
        decimals: mockAssetData.decimals,
        totalSupply: mockAssetData.totalSupply,
        circulatingSupply: mockAssetData.circulatingSupply,
      },
    });
  });
});
