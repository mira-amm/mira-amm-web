import {BRAND_CONFIGS} from "./brand-config";

/**
 * Gets brand-specific text based on the current environment
 * This is the main utility function for accessing brand-specific content
 */
export function getBrandText() {
  const brand = BRAND_CONFIGS["microchain"];

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
