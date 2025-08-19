import {
  LiquidityShape,
  SimulationDataPoint,
} from "../components/pages/bin-liquidity/components/simulated-distribution";

export const generateSimulationData = (
  liquidityShape: LiquidityShape,
  numBins: number
): SimulationDataPoint[] => {
  const data: SimulationDataPoint[] = [];

  // Ensure we have a meaningful price range
  const actualMinPrice = Math.min(1200, 1800);
  const actualMaxPrice = Math.max(1200, 1800);
  const priceRange = Math.max(actualMaxPrice - actualMinPrice, 200); // Minimum range of 200
  const center = (actualMinPrice + actualMaxPrice) / 2;

  // Fixed total bars regardless of selected bins - prevents overflow
  const totalBars = 120; // Always same amount of data
  const mainBins = numBins; // User's selected bins in the center
  const extensionBars = totalBars - mainBins; // Remaining bars for context
  const leftExtension = Math.floor(extensionBars / 2);
  const rightExtension = extensionBars - leftExtension;

  const extendedRange = priceRange * 2.5;
  const startPrice = actualMinPrice - extendedRange * 0.35;
  const step = extendedRange / (totalBars - 1);

  const mainStartIndex = leftExtension;
  const mainEndIndex = leftExtension + mainBins - 1;
  const middleIndex = Math.floor((mainStartIndex + mainEndIndex) / 2);

  for (let i = 0; i < totalBars; i++) {
    const price = startPrice + i * step;
    let baseIntensity = 0;

    // Calculate base liquidity intensity based on shape and position
    const isInMainRange = i >= mainStartIndex && i <= mainEndIndex;
    const distanceFromCenter = Math.abs(price - center);
    const distanceFromMainRange = isInMainRange
      ? 0
      : Math.min(Math.abs(i - mainStartIndex), Math.abs(i - mainEndIndex));

    if (liquidityShape === "spot") {
      // Spot liquidity: 120px for main bins, 60px (50%) for surrounding
      const isInMainRange = i >= mainStartIndex && i <= mainEndIndex;
      if (isInMainRange) {
        baseIntensity = 120; // Full height for your selected bins
      } else {
        baseIntensity = 60; // 50% height for surrounding bars
      }
    } else if (liquidityShape === "curve") {
      // Curve: Mountain shape with 120px max height
      const centerIndex = Math.floor(totalBars / 2);
      const distanceFromCenter = Math.abs(i - centerIndex);
      const maxDistanceFromCenter = Math.floor(totalBars / 2);

      if (maxDistanceFromCenter === 0) {
        baseIntensity = 120; // Single bar case
      } else {
        // Mountain shape: tallest at center (120), shortest at edges (60)
        const heightRatio = 1 - distanceFromCenter / maxDistanceFromCenter;
        baseIntensity = 60 + heightRatio * 60; // Range from 60 to 120
      }
    } else {
      // Bid-Ask: More pronounced V-shape - deeper valley
      const centerIndex = Math.floor(totalBars / 2);
      const distanceFromCenter = Math.abs(i - centerIndex);
      const maxDistanceFromCenter = Math.floor(totalBars / 2);

      if (maxDistanceFromCenter === 0) {
        baseIntensity = 140; // Single bar case
      } else {
        // Deeper V-shape: tallest at edges (140), much shorter at center (60)
        const heightRatio = distanceFromCenter / maxDistanceFromCenter;
        baseIntensity = 60 + heightRatio * 80; // Range from 60 to 140
      }
    }

    // Apply distance-based reduction for extension bars (except for spot and bid-ask)
    if (
      !isInMainRange &&
      liquidityShape !== "spot" &&
      liquidityShape !== "bidask"
    ) {
      const reductionFactor = Math.max(0.15, 1 - distanceFromMainRange * 0.08);
      baseIntensity *= reductionFactor;
    }

    let uniHeight = 0;
    let ethHeight = 0;

    // Determine which tokens appear based on position
    if (i <= middleIndex) {
      // Left side (including extensions): Only UNI
      if (liquidityShape === "curve") {
        uniHeight = Math.max(8, Math.round(baseIntensity)); // Total height follows curve
      } else if (liquidityShape === "spot") {
        uniHeight = Math.round(baseIntensity); // No variation for spot
      } else if (liquidityShape === "bidask") {
        uniHeight = Math.round(baseIntensity); // No variation for uniform V-shape
      } else {
        uniHeight = Math.round(baseIntensity + Math.random() * 15);
      }
      ethHeight = 0;
    } else if (i === middleIndex + 1 && isInMainRange) {
      // Middle bin: Both tokens stacked (only in main range)
      if (liquidityShape === "curve") {
        // Split the curve height between the two tokens, don't add them
        const totalCurveHeight = Math.max(8, Math.round(baseIntensity));
        uniHeight = Math.round(totalCurveHeight * 0.45); // 45% for UNI
        ethHeight = Math.round(totalCurveHeight * 0.55); // 55% for ETH
      } else if (liquidityShape === "spot") {
        // Split the spot height equally between tokens
        const totalSpotHeight = Math.round(baseIntensity);
        uniHeight = Math.round(totalSpotHeight * 0.45); // 45% for UNI
        ethHeight = Math.round(totalSpotHeight * 0.55); // 55% for ETH
      } else if (liquidityShape === "bidask") {
        // Split the V-shape height between tokens
        const totalVHeight = Math.round(baseIntensity);
        uniHeight = Math.round(totalVHeight * 0.45); // 45% for UNI
        ethHeight = Math.round(totalVHeight * 0.55); // 55% for ETH
      } else {
        uniHeight = Math.round(baseIntensity * 0.65 + Math.random() * 10);
        ethHeight = Math.round(baseIntensity * 0.75 + Math.random() * 10);
      }
    } else {
      // Right side (including extensions): Only ETH
      if (liquidityShape === "curve") {
        ethHeight = Math.max(8, Math.round(baseIntensity)); // Total height follows curve
      } else if (liquidityShape === "spot") {
        ethHeight = Math.round(baseIntensity); // No variation for spot
      } else if (liquidityShape === "bidask") {
        ethHeight = Math.round(baseIntensity); // No variation for uniform V-shape
      } else {
        ethHeight = Math.round(baseIntensity + Math.random() * 15);
      }
      uniHeight = 0;
    }

    // Ensure minimum visible heights with some variation
    if (uniHeight > 0) uniHeight = Math.max(5, uniHeight);
    if (ethHeight > 0) ethHeight = Math.max(5, ethHeight);

    // Show up to 6 price labels evenly distributed across the chart
    const totalLabels = 6;
    const labelInterval = Math.floor(totalBars / (totalLabels - 1));
    const showPrice = i % labelInterval === 0 || i === totalBars - 1;

    data.push({
      price: showPrice ? price.toFixed(0) : "",
      uniHeight,
      ethHeight,
      showPrice,
    });
  }

  return data;
};
