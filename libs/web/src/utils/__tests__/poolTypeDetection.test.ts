import {BN} from "fuels";
import {
  detectPoolType,
  isV1PoolId,
  isV2PoolId,
  poolIdToString,
} from "../poolTypeDetection";
import {expect} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {describe} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {describe} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {describe} from "vitest";
import {describe} from "vitest";

describe("poolTypeDetection", () => {
  describe("detectPoolType", () => {
    it("should detect v1 pool ID (tuple format)", () => {
      const v1PoolId = [
        {bits: "0x1234567890abcdef"},
        {bits: "0xfedcba0987654321"},
        false,
      ] as any;

      expect(detectPoolType(v1PoolId)).toBe("v1");
    });

    it("should detect v2 pool ID (BN format)", () => {
      const v2PoolId = new BN("12345");

      expect(detectPoolType(v2PoolId)).toBe("v2");
    });

    it("should default to v1 for unknown formats", () => {
      const unknownPoolId = "unknown" as any;

      expect(detectPoolType(unknownPoolId)).toBe("v1");
    });
  });

  describe("type guards", () => {
    it("isV1PoolId should correctly identify v1 pools", () => {
      const v1PoolId = [
        {bits: "0x1234567890abcdef"},
        {bits: "0xfedcba0987654321"},
        false,
      ] as any;

      expect(isV1PoolId(v1PoolId)).toBe(true);
      expect(isV1PoolId(new BN("12345"))).toBe(false);
    });

    it("isV2PoolId should correctly identify v2 pools", () => {
      const v2PoolId = new BN("12345");
      const v1PoolId = [
        {bits: "0x1234567890abcdef"},
        {bits: "0xfedcba0987654321"},
        false,
      ] as any;

      expect(isV2PoolId(v2PoolId)).toBe(true);
      expect(isV2PoolId(v1PoolId)).toBe(false);
    });
  });

  describe("poolIdToString", () => {
    it("should convert v2 pool ID to string", () => {
      const v2PoolId = new BN("12345");

      expect(poolIdToString(v2PoolId)).toBe("12345");
    });

    it("should convert v1 pool ID to string", () => {
      const v1PoolId = [
        {bits: "0x1234567890abcdef"},
        {bits: "0xfedcba0987654321"},
        false,
      ] as any;

      expect(poolIdToString(v1PoolId)).toBe(
        "0x1234567890abcdef-0xfedcba0987654321-false"
      );
    });

    it("should handle unknown formats", () => {
      const unknownPoolId = "unknown" as any;

      expect(poolIdToString(unknownPoolId)).toBe("unknown");
    });

    it("should handle null/undefined formats", () => {
      const nullPoolId = null as any;
      const undefinedPoolId = undefined as any;

      expect(poolIdToString(nullPoolId)).toBe("unknown");
      expect(poolIdToString(undefinedPoolId)).toBe("unknown");
    });
  });
});
