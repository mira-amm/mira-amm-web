import {BrandMetadata, BrandType} from "./types";
import {BRAND_CONFIGS} from "./brand-config";

/**
 * Validates the environment variable for rebrand UI
 */
function validateEnvironment(): void {
  const rebrandFlag = process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI;
  if (rebrandFlag && !["true", "false"].includes(rebrandFlag)) {
    console.warn(
      "Invalid NEXT_PUBLIC_ENABLE_REBRAND_UI value, defaulting to false"
    );
  }
}

/**
 * Determines the current brand based on environment variable
 */
function getCurrentBrand(): BrandType {
  validateEnvironment();
  const isRebrandEnabled = process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI === "true";
  return isRebrandEnabled ? "microchain" : "mira";
}

/**
 * Gets the brand metadata configuration for the current environment
 */
export function getBrandMetadata(): BrandMetadata {
  const currentBrand = getCurrentBrand();
  return BRAND_CONFIGS[currentBrand];
}

/**
 * Gets brand-specific text based on the current environment
 * This is the main utility function for accessing brand-specific content
 */
export function getBrandText() {
  const brand = getBrandMetadata();

  return {
    brandName: brand.brandName,
    siteName: brand.siteName,
    baseUrl: brand.baseUrl,
    defaultTitle: brand.defaultTitle,
    defaultDescription: brand.defaultDescription,
    defaultImage: brand.defaultImage,
    favicon: brand.favicon,
  };
}
