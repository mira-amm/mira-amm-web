import { getBrandText } from "./brandName";

/**
 * Get brand-aware banner text - SSR safe
 */
export function getBrandBannerText() {
  const brandText = getBrandText();
  
  return {
    title: "Introducing Points",
    subheader: `Earn ${brandText.name.toUpperCase()} points by providing liquidity and engaging in activities.`
  };
}