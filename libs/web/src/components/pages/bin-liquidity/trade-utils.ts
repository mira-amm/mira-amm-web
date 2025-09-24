export const TradeUtils = {
  // binStep is in basis points (e.g., 25 for 0.25%)
  getLogBase: (binStep: any) => Math.log(1 + binStep / 10000),

  calculateBinsFromPrices: (minPrice: any, maxPrice: any, binStep: any) => {
    const logBase = TradeUtils.getLogBase(binStep);
    const minBinId = Math.floor(Math.log(minPrice) / logBase);
    const maxBinId = Math.ceil(Math.log(maxPrice) / logBase);
    return maxBinId - minBinId + 1;
  },

  calculateMaxPriceFromBins: (
    minPrice: any,
    binStep: any,
    numberOfBins: any
  ) => {
    const logBase = TradeUtils.getLogBase(binStep);
    const minBinId = Math.floor(Math.log(minPrice) / logBase);
    const maxBinId = minBinId + numberOfBins - 1;
    return Math.pow(1 + binStep / 10000, maxBinId);
  },

  getBinsAroundCurrentPrice: (
    currentPrice: any,
    binStep: any,
    binsAround = 5
  ) => {
    const logBase = TradeUtils.getLogBase(binStep);
    const currentBinData = {
      exactBinId: Math.log(currentPrice) / logBase,
      alignedBinId: Math.round(Math.log(currentPrice) / logBase),
    };

    const minBinId = currentBinData.alignedBinId - binsAround;
    const maxBinId = currentBinData.alignedBinId + binsAround;

    const binData = [];
    for (let binId = minBinId; binId <= maxBinId; binId++) {
      const price = Math.pow(1 + binStep / 10000, binId);
      binData.push({
        binId,
        price,
        isActive: binId === currentBinData.alignedBinId,
        distanceFromActive: Math.abs(binId - currentBinData.alignedBinId),
        priceChangeFromCurrent: ((price - currentPrice) / currentPrice) * 100,
      });
    }

    return {
      centerBinId: currentBinData.alignedBinId,
      centerPrice: Math.pow(1 + binStep / 10000, currentBinData.alignedBinId),
      currentPrice,
      binData,
      totalBins: binData.length,
    };
  },

  calculateLiquidityBook: (params: any) => {
    const {minPrice, maxPrice, binStep, currentPrice} = params;

    if (!minPrice || !maxPrice || !binStep || !currentPrice || binStep <= 0) {
      return null;
    }

    const logBase = TradeUtils.getLogBase(binStep);

    // Calculate bin IDs
    const exactMinBinId = Math.log(minPrice) / logBase;
    const exactMaxBinId = Math.log(maxPrice) / logBase;
    const alignedMinBinId = Math.floor(exactMinBinId);
    const alignedMaxBinId = Math.ceil(exactMaxBinId);

    // Calculate actual prices and bins
    const numberOfBins = alignedMaxBinId - alignedMinBinId + 1;
    const actualMinPrice = Math.pow(1 + binStep / 10000, alignedMinBinId);
    const actualMaxPrice = Math.pow(1 + binStep / 10000, alignedMaxBinId);

    // Current price analysis
    const exactCurrentBinId = Math.log(currentPrice) / logBase;
    const activeBinId = Math.round(exactCurrentBinId);
    const activeBinPrice = Math.pow(1 + binStep / 10000, activeBinId);
    const isCurrentPriceInRange =
      activeBinId >= alignedMinBinId && activeBinId <= alignedMaxBinId;

    return {
      inputMinPrice: minPrice,
      inputMaxPrice: maxPrice,
      binStep,
      currentPrice,
      minBinId: alignedMinBinId,
      maxBinId: alignedMaxBinId,
      numberOfBins,
      actualMinPrice,
      actualMaxPrice,
      activeBinId,
      activeBinPrice,
      isCurrentPriceInRange,
      exactMinBinId,
      exactMaxBinId,
      exactCurrentBinId,
      priceRangePercentage: ((maxPrice - minPrice) / minPrice) * 100,
    };
  },
};
