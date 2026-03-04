import {describe, it, expect} from "vitest";
import {BN} from "fuels";
import {
  getPoolNavigationUrl,
  shouldUseV2UI,
  getPoolTypeDisplayName,
} from "../poolNavigation";

describe("poolNavigation", () => {
  describe("getPoolNavigationUrl", () => {
    it("should generate v1 add liquidity URL for v1 pools", () => {
      const v1PoolId = [{bits: "0x1234"}, {bits: "0x5678"}, false] as any;

      const url = getPoolNavigationUrl(v1PoolId, "add");
      expect(url).toBe("/liquidity/add?pool=0x1234-0x5678-false");
    });

    it("should generate v2 add liquidity URL for v2 pools", () => {
      const v2PoolId = new BN("12345");

      const url = getPoolNavigationUrl(v2PoolId, "add");
      expect(url).toBe("/liquidity/add-v2?pool=12345");
    });

    it("should generate v1 view URL for v1 pools", () => {
      const v1PoolId = [{bits: "0x1234"}, {bits: "0x5678"}, true] as any;

      const url = getPoolNavigationUrl(v1PoolId, "view");
      expect(url).toBe("/liquidity/position?pool=0x1234-0x5678-true");
    });

    it("should generate v2 view URL for v2 pools", () => {
      const v2PoolId = new BN("67890");

      const url = getPoolNavigationUrl(v2PoolId, "view");
      expect(url).toBe("/liquidity/pool-v2/67890");
    });

    it("should generate v1 manage URL for v1 pools", () => {
      const v1PoolId = [{bits: "0x1234"}, {bits: "0x5678"}, false] as any;

      const url = getPoolNavigationUrl(v1PoolId, "manage");
      expect(url).toBe("/liquidity/position?pool=0x1234-0x5678-false");
    });

    it("should generate v2 manage URL for v2 pools", () => {
      const v2PoolId = new BN("11111");

      const url = getPoolNavigationUrl(v2PoolId, "manage");
      expect(url).toBe("/liquidity/manage-v2?pool=11111");
    });

    it("should default to add action when no action specified", () => {
      const v2PoolId = new BN("22222");

      const url = getPoolNavigationUrl(v2PoolId);
      expect(url).toBe("/liquidity/add-v2?pool=22222");
    });
  });

  describe("shouldUseV2UI", () => {
    it("should return false for v1 pools", () => {
      const v1PoolId = [{bits: "0x1234"}, {bits: "0x5678"}, false] as any;

      expect(shouldUseV2UI(v1PoolId)).toBe(false);
    });

    it("should return true for v2 pools", () => {
      const v2PoolId = new BN("12345");

      expect(shouldUseV2UI(v2PoolId)).toBe(true);
    });
  });

  describe("getPoolTypeDisplayName", () => {
    it("should return 'Traditional AMM' for v1 pools", () => {
      const v1PoolId = [{bits: "0x1234"}, {bits: "0x5678"}, false] as any;

      expect(getPoolTypeDisplayName(v1PoolId)).toBe("Traditional AMM");
    });

    it("should return 'Concentrated Liquidity' for v2 pools", () => {
      const v2PoolId = new BN("12345");

      expect(getPoolTypeDisplayName(v2PoolId)).toBe("Concentrated Liquidity");
    });
  });
});
