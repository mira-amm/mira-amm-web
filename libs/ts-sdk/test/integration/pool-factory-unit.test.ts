import {describe, it, expect} from "vitest";
import {STANDARD_POOL_CONFIGS} from "./setup";

describe("Pool Factory Unit Tests", () => {
  describe("Standard Pool Configurations", () => {
    it("should have correct STABLE pool configuration", () => {
      const stableConfig = STANDARD_POOL_CONFIGS.STABLE;

      expect(stableConfig).toEqual({
        type: "STABLE",
        binStep: 1,
        baseFactor: 5000,
        protocolShare: 0,
        description: "Low volatility pairs (stablecoins) with minimal fees",
      });
    });

    it("should have correct VOLATILE pool configuration", () => {
      const volatileConfig = STANDARD_POOL_CONFIGS.VOLATILE;

      expect(volatileConfig).toEqual({
        type: "VOLATILE",
        binStep: 20,
        baseFactor: 8000,
        protocolShare: 0,
        description: "Medium volatility pairs with standard fees",
      });
    });

    it("should have correct EXOTIC pool configuration", () => {
      const exoticConfig = STANDARD_POOL_CONFIGS.EXOTIC;

      expect(exoticConfig).toEqual({
        type: "EXOTIC",
        binStep: 50,
        baseFactor: 15000,
        protocolShare: 0,
        description: "High volatility or exotic pairs with higher fees",
      });
    });

    it("should have all three standard pool types", () => {
      const configKeys = Object.keys(STANDARD_POOL_CONFIGS);

      expect(configKeys).toHaveLength(3);
      expect(configKeys).toContain("STABLE");
      expect(configKeys).toContain("VOLATILE");
      expect(configKeys).toContain("EXOTIC");
    });

    it("should have increasing bin steps from STABLE to EXOTIC", () => {
      const stableBinStep = STANDARD_POOL_CONFIGS.STABLE.binStep;
      const volatileBinStep = STANDARD_POOL_CONFIGS.VOLATILE.binStep;
      const exoticBinStep = STANDARD_POOL_CONFIGS.EXOTIC.binStep;

      expect(stableBinStep).toBeLessThan(volatileBinStep);
      expect(volatileBinStep).toBeLessThan(exoticBinStep);
    });

    it("should have increasing base factors from STABLE to EXOTIC", () => {
      const stableBaseFactor = STANDARD_POOL_CONFIGS.STABLE.baseFactor;
      const volatileBaseFactor = STANDARD_POOL_CONFIGS.VOLATILE.baseFactor;
      const exoticBaseFactor = STANDARD_POOL_CONFIGS.EXOTIC.baseFactor;

      expect(stableBaseFactor).toBeLessThan(volatileBaseFactor);
      expect(volatileBaseFactor).toBeLessThan(exoticBaseFactor);
    });
  });
});
