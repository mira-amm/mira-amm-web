import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {NextRequest} from "next/server";
import {GET, OPTIONS} from "../../app/api/protocol-stats/route";
import {statsService} from "@/web/src/core/stats-service";
import type {ProtocolStatsData} from "@/web/src/types/protocol-stats";

// Mock the stats service
vi.mock("@/web/src/core/stats-service", () => ({
  statsService: {
    fetchProtocolStats: vi.fn(),
  },
}));

describe("Protocol Stats API Route", () => {
  const mockStatsData: ProtocolStatsData = {
    totalTVL: 1000000,
    allTimeVolume: 5000000,
    oneDayVolume: 100000,
    sevenDayVolume: 500000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/protocol-stats", () => {
    it("should return protocol stats with correct cache headers", async () => {
      // Arrange
      vi.mocked(statsService.fetchProtocolStats).mockResolvedValue(
        mockStatsData
      );

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockStatsData);

      // Check cache headers
      expect(response.headers.get("Cache-Control")).toBe(
        "public, s-maxage=300, stale-while-revalidate=600"
      );
      expect(response.headers.get("CDN-Cache-Control")).toBe(
        "public, s-maxage=300"
      );
      expect(response.headers.get("Vercel-CDN-Cache-Control")).toBe(
        "public, s-maxage=300"
      );

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type"
      );

      // Verify service was called
      expect(statsService.fetchProtocolStats).toHaveBeenCalledOnce();
    });

    it("should handle service errors with proper error response", async () => {
      // Arrange
      const errorMessage = "GraphQL query failed";
      vi.mocked(statsService.fetchProtocolStats).mockRejectedValue(
        new Error(errorMessage)
      );

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Failed to fetch protocol statistics",
        message: errorMessage,
      });

      // Check error response headers
      expect(response.headers.get("Cache-Control")).toBe(
        "no-cache, no-store, must-revalidate"
      );
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");

      // Verify service was called
      expect(statsService.fetchProtocolStats).toHaveBeenCalledOnce();
    });

    it("should handle unknown errors gracefully", async () => {
      // Arrange
      vi.mocked(statsService.fetchProtocolStats).mockRejectedValue(
        "Unknown error"
      );

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Failed to fetch protocol statistics",
        message: "Unknown error occurred",
      });

      // Verify service was called
      expect(statsService.fetchProtocolStats).toHaveBeenCalledOnce();
    });

    it("should return valid data structure", async () => {
      // Arrange
      vi.mocked(statsService.fetchProtocolStats).mockResolvedValue(
        mockStatsData
      );

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data).toHaveProperty("totalTVL");
      expect(data).toHaveProperty("allTimeVolume");
      expect(data).toHaveProperty("oneDayVolume");
      expect(data).toHaveProperty("sevenDayVolume");

      expect(typeof data.totalTVL).toBe("number");
      expect(typeof data.allTimeVolume).toBe("number");
      expect(typeof data.oneDayVolume).toBe("number");
      expect(typeof data.sevenDayVolume).toBe("number");
    });
  });

  describe("OPTIONS /api/protocol-stats", () => {
    it("should handle CORS preflight requests", async () => {
      // Act
      const response = await OPTIONS();

      // Assert
      expect(response.status).toBe(200);

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, OPTIONS"
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type"
      );

      // Should have no body
      const body = await response.text();
      expect(body).toBe("");
    });
  });

  describe("Cache Control Headers", () => {
    it("should set 5-minute server-side caching as specified in requirements", async () => {
      // Arrange
      vi.mocked(statsService.fetchProtocolStats).mockResolvedValue(
        mockStatsData
      );

      // Act
      const response = await GET();

      // Assert - 5 minutes = 300 seconds
      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toContain("s-maxage=300");
      expect(cacheControl).toContain("public");
      expect(cacheControl).toContain("stale-while-revalidate=600");
    });

    it("should not cache error responses", async () => {
      // Arrange
      vi.mocked(statsService.fetchProtocolStats).mockRejectedValue(
        new Error("Test error")
      );

      // Act
      const response = await GET();

      // Assert
      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe("no-cache, no-store, must-revalidate");
    });
  });
});
