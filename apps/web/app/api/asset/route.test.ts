import {GET} from "./route";
import {NextRequest} from "next/server";

describe("test for GET /api/asset", () => {
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

  beforeAll(() => {
    // Mock MainnetUrl if needed
    jest.mock("../../../../../libs/web/src/utils/constants", () => ({
      MainnetUrl: mockMainnetUrl,
    }));
  });

  afterAll(() => {
    jest.restoreAllMocks(); // Restore the original implementations after tests
  });

  it("should return 400 if 'id' query parameter is missing", async () => {
    const req = new NextRequest(`https://mock-api.com/api/asset`);
    const res = await GET(req);

    expect(res.status).toBe(400);
    const jsonResponse = await res.json();
    expect(jsonResponse).toEqual({error: "Asset ID is required"});
  });

  it("should return 404 if the asset is not found", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const req = new NextRequest(
      `https://mock-api.com/api/asset?id=${mockAssetId}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(404);
    const jsonResponse = await res.json();
    expect(jsonResponse).toEqual({
      error: `Asset with ID: ${mockAssetId} not found`,
    });
  });

  it("should return 500 if there is an error fetching asset data", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const req = new NextRequest(
      `https://mock-api.com/api/asset?id=${mockAssetId}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(500);
    const jsonResponse = await res.json();
    expect(jsonResponse).toEqual({error: "Failed to fetch asset data"});
  });

  it("should return 200 with transformed asset data", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockAssetData),
    });

    const req = new NextRequest(
      `https://mock-api.com/api/asset?id=${mockAssetId}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const jsonResponse = await res.json();
    expect(jsonResponse).toEqual({
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
