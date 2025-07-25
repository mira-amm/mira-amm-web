/**
 * Check if rebrand is enabled - SSR safe
 */
function isRebrandEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI === "true";
}

/**
 * Returns the appropriate brand name based on the rebrand feature flag
 * SSR-safe version that uses environment variable directly
 */
export function getBrandName(): string {
  return isRebrandEnabled() ? "Microchain" : "Mira";
}

/**
 * Returns brand-specific text based on the rebrand feature flag
 * SSR-safe version that uses environment variable directly
 */
export function getBrandText() {
  const rebrandEnabled = isRebrandEnabled();

  return {
    name: rebrandEnabled ? "Microchain" : "Mira",
    dex: rebrandEnabled ? "Microchain DEX" : "Mira DEX",
    points: rebrandEnabled ? "Microchain Points" : "Mira Points",
    pointsProgram: rebrandEnabled
      ? "Microchain Points Program"
      : "Mira Points Program",
    logo: rebrandEnabled ? "Microchain Logo" : "Mira Logo",
  };
}
