import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {getBrandMetadata, getBrandText} from "../../../libs/web/src/metadata";

describe("Brand Configuration Helper", () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI;

  afterEach(() => {
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI;
    }
  });

  describe("when rebrand is disabled", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI = "false";
    });

    it("should return mira branding", () => {
      const brand = getBrandMetadata();
      expect(brand.brandName).toBe("MIRA");
      expect(brand.siteName).toBe("MIRA DEX");
      expect(brand.baseUrl).toBe("https://mira.ly");
    });

    it("should return mira text through getBrandText", () => {
      const brandText = getBrandText();
      expect(brandText.brandName).toBe("MIRA");
      expect(brandText.defaultTitle).toContain("MIRA");
      expect(brandText.defaultDescription).toContain("MIRA DEX");
    });

    it("should return mira assets", () => {
      const brand = getBrandMetadata();
      expect(brand.defaultImage).toBe("https://mira.ly/images/preview.png");
      expect(brand.favicon).toBe("/images/favicon.png");
    });
  });

  describe("when rebrand is enabled", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI = "true";
    });

    it("should return microchain branding", () => {
      const brand = getBrandMetadata();
      expect(brand.brandName).toBe("Microchain");
      expect(brand.siteName).toBe("Microchain DEX");
      expect(brand.baseUrl).toBe("https://microchain.systems");
    });

    it("should return microchain text through getBrandText", () => {
      const brandText = getBrandText();
      expect(brandText.brandName).toBe("Microchain");
      expect(brandText.defaultTitle).toContain("Microchain");
      expect(brandText.defaultDescription).toContain("Microchain DEX");
    });

    it("should return microchain assets", () => {
      const brand = getBrandMetadata();
      expect(brand.defaultImage).toBe(
        "https://microchain.systems/images/microchain-preview.png"
      );
      expect(brand.favicon).toBe("/images/microchain-favicon.png");
    });
  });

  describe("when environment variable is undefined", () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI;
    });

    it("should default to mira branding", () => {
      const brand = getBrandMetadata();
      expect(brand.brandName).toBe("MIRA");
    });
  });

  describe("when environment variable is invalid", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI = "invalid";
    });

    it("should default to mira branding and log warning", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const brand = getBrandMetadata();
      expect(brand.brandName).toBe("MIRA");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Invalid NEXT_PUBLIC_ENABLE_REBRAND_UI value, defaulting to false"
      );

      consoleSpy.mockRestore();
    });
  });
});
