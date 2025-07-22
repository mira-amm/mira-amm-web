import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {getBrandMetadata} from "../../../libs/web/src/metadata";

describe("Metadata Integration - Asset Verification", () => {
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

    it("should use mira assets", () => {
      const brand = getBrandMetadata();
      expect(brand.defaultImage).toBe("https://mira.ly/images/preview.png");
      expect(brand.favicon).toBe("/images/favicon.png");
    });
  });

  describe("when rebrand is enabled", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI = "true";
    });

    it("should use microchain assets", () => {
      const brand = getBrandMetadata();
      expect(brand.defaultImage).toBe(
        "https://microchain.systems/images/microchain-preview.png"
      );
      expect(brand.favicon).toBe("/images/microchain-favicon.png");
    });
  });

  describe("asset files exist", () => {
    it("should have microchain preview image", async () => {
      // Test that the file exists by attempting to read it
      const fs = await import("fs");
      const path = await import("path");

      const imagePath = path.join(
        process.cwd(),
        "public/images/microchain-preview.png"
      );
      expect(fs.existsSync(imagePath)).toBe(true);
    });

    it("should have microchain favicon", async () => {
      // Test that the file exists by attempting to read it
      const fs = await import("fs");
      const path = await import("path");

      const faviconPath = path.join(
        process.cwd(),
        "public/images/microchain-favicon.png"
      );
      expect(fs.existsSync(faviconPath)).toBe(true);
    });
  });
});
