// notes
const bins = [
  {liquidityX: 1, liquidityY: 0, binId: 1},
  {liquidityX: 2, liquidityY: 2, binId: 2},
  {liquidityX: 0, liquidityY: 2, binId: 3},
  {liquidityX: 0, liquidityY: 2, binId: 4},
  {liquidityX: 0, liquidityY: 2, binId: 5},
];

const currentBin = 2;

// delataids = length of distribution
// when generating distribubion, determine deltaIds, using same value `generateLiquidityDistribution`
// we can return the delataIDs, distributionX, distributionY using those same values
const deltaIds = [
  {Negative: 1},
  {Positive: 0},
  {Positive: 1},
  {Positive: 2},
  {Positive: 3},
];

// distributionX
// sum the values of x to get the total
// express each item as a percentage of the total
// e.g (item at index o / total liquidity) * 100
// note to express as 1e18

const distributionX = [33.33, 66.67, 0, 0, 0];

const distributionY = [0, 25, 25, 25, 25];
