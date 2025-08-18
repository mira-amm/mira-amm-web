/**
 * Returns the brand name - now always "Microchain" since rebrand is live
 */
export function getBrandName(): string {
  return "Microchain";
}

/**
 * Returns brand-specific text - now always uses "Microchain" since rebrand is live
 */
export function getBrandText() {
  return {
    name: "Microchain",
    dex: "Microchain DEX",
    points: "Microchain Points",
    pointsProgram: "Microchain Points Program",
    logo: "Microchain Logo",
  };
}
