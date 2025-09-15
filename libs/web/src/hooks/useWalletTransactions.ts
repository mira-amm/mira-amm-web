import {gql, request} from "graphql-request";
import {useQuery} from "@tanstack/react-query";
import {B256Address} from "fuels";
import {DefaultLocale, SQDIndexerUrl} from "../utils/constants";
import {useMemo} from "react";
import {CoinDataWithPrice} from "../utils/coinsConfig";
import {useAssetList} from "./useAssetList";
import {useWalletTransactions as useIndexerWalletTransactions} from "@/indexer";

export type TransactionFromQuery = {
  id: string;
  amount0In: string;
  amount0Out: string;
  amount1In: string;
  amount1Out: string;
  type: "ADD_LIQUIDITY" | "REMOVE_LIQUIDITY" | "SWAP";
  asset0: {
    symbol: string;
    decimals: number;
    assetId?: string; // Optional for backward compatibility
  };
  asset1: {
    symbol: string;
    decimals: number;
    assetId?: string; // Optional for backward compatibility
  };
  transaction: string; // Transaction hash from Subquid
  recipient: string;
  timestamp?: number; // Optional timestamp from Subquid
  poolId?: string; // Optional pool ID from Subquid
};

export type TransactionsDataFromQuery = {
  actions: TransactionFromQuery[];
};

export type Transaction = {
  tx_id: string;
  asset_0_in: string;
  asset_0_out: string;
  asset_1_in: string;
  asset_1_out: string;
  block_time: number;
  pool_id: string;
  transaction_type: "ADD_LIQUIDITY" | "REMOVE_LIQUIDITY" | "SWAP";
  extra: Transaction[];
};

export type TransactionsData = {
  Transaction: Transaction[];
};

type AssetsAmounts = {
  firstAssetAmount: string;
  secondAssetAmount: string;
  firstAsset: CoinDataWithPrice;
  secondAsset: CoinDataWithPrice;
  reversedAssetsOrder: boolean;
};

interface TransactionProps extends AssetsAmounts {
  date: string;
  name: string;
  firstAssetAmount: string;
  secondAssetAmount: string;
  withdrawal?: boolean;
  addLiquidity?: boolean;
  tx_id: string;
}

const transformTransactionsDataAndGroupByDate = (
  transactionsData: TransactionsData,
  assets: CoinDataWithPrice[]
): Record<string, TransactionProps[]> => {
  const grouped: Record<string, TransactionProps[]> = {};

  // Sort transactions by block time (newest first)
  const transactions = [...transactionsData.Transaction].sort(
    (txA, txB) => txB.block_time - txA.block_time
  );

  transactions.forEach((transaction) => {
    // Format the date
    const date = formatDate(transaction.block_time);

    // Calculate asset amounts
    const assetAmounts = calculateAssetAmounts(transaction, assets);

    if (!assetAmounts) return;

    // Create the transaction object
    const transformedTransaction = createTransactionObject(
      transaction,
      date,
      assetAmounts
    );

    // Add to grouped results
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(transformedTransaction);
  });

  return grouped;
};

// Helper function to format the date
const formatDate = (blockTime: number): string => {
  return new Date(blockTime * 1000).toLocaleDateString(DefaultLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Helper function to find assets involved in transaction
const getTransactionAssets = (
  transaction: Transaction,
  assets: CoinDataWithPrice[]
): [CoinDataWithPrice | undefined, CoinDataWithPrice | undefined] => {
  const [firstAssetId, secondAssetId] = transaction.pool_id.split("_");

  const firstAsset = assets.find(
    (asset) => asset.assetId.toLowerCase() === firstAssetId.toLowerCase()
  );

  const secondAsset = assets.find(
    (asset) => asset.assetId.toLowerCase() === secondAssetId.toLowerCase()
  );

  return [firstAsset, secondAsset];
};

// Helper function to format asset amounts with proper decimal handling
const formatAssetAmount = (
  amountBigInt: bigint,
  decimals: number,
  maxDisplayDecimals: number = 6
): string => {
  // Convert BigInt to decimal number
  const divisor = BigInt(10 ** decimals);
  const wholePart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;

  if (fractionalPart === BigInt(0)) {
    return wholePart.toString();
  }

  // Convert fractional part to decimal string with proper padding
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");

  // Limit display decimals to prevent overly long strings
  const displayDecimals = Math.min(decimals, maxDisplayDecimals);
  const truncatedFractional = fractionalStr.substring(0, displayDecimals);

  // Remove trailing zeros
  const trimmedFractional = truncatedFractional.replace(/0+$/, "");

  if (trimmedFractional === "") {
    return wholePart.toString();
  }

  return `${wholePart}.${trimmedFractional}`;
};

// Helper function to safely convert string amounts to BigInt
const safeStringToBigInt = (amountStr: string): bigint => {
  try {
    // Handle empty strings or undefined
    if (!amountStr || amountStr === "0" || amountStr === "") {
      return BigInt(0);
    }

    // Remove any decimal points (Subquid should provide integer strings)
    const cleanAmount = amountStr.split(".")[0];

    // Validate that it's a valid number string
    if (!/^\d+$/.test(cleanAmount)) {
      console.warn(`Invalid amount string: ${amountStr}, defaulting to 0`);
      return BigInt(0);
    }

    return BigInt(cleanAmount);
  } catch (error) {
    console.warn(`Error converting amount to BigInt: ${amountStr}`, error);
    return BigInt(0);
  }
};

// Helper function to calculate asset amounts
const calculateAssetAmounts = (
  transaction: Transaction,
  assets: CoinDataWithPrice[]
) => {
  const [firstAsset, secondAsset] = getTransactionAssets(transaction, assets);
  if (!firstAsset || !secondAsset) {
    return; // Skip if assets not found
  }
  const firstAssetDecimals = firstAsset.decimals;
  const secondAssetDecimals = secondAsset.decimals;

  // Convert string amounts to BigInt for precise calculations
  const firstAssetInBigInt = safeStringToBigInt(transaction.asset_0_in);
  const firstAssetOutBigInt = safeStringToBigInt(transaction.asset_0_out);
  const secondAssetInBigInt = safeStringToBigInt(transaction.asset_1_in);
  const secondAssetOutBigInt = safeStringToBigInt(transaction.asset_1_out);

  if (transaction.transaction_type === "SWAP") {
    // With net flow analysis, multi-hop swaps are already consolidated
    // The transaction will have the input asset in asset_0_in and output asset in asset_1_out
    // or vice versa, with intermediate assets filtered out

    // Determine swap direction based on which amounts are non-zero
    const hasAsset0In = firstAssetInBigInt > BigInt(0);
    const hasAsset0Out = firstAssetOutBigInt > BigInt(0);
    const hasAsset1In = secondAssetInBigInt > BigInt(0);
    const hasAsset1Out = secondAssetOutBigInt > BigInt(0);

    let fromAsset: CoinDataWithPrice;
    let toAsset: CoinDataWithPrice;
    let fromAmountBigInt: bigint;
    let toAmountBigInt: bigint;
    let reversedAssetsOrder: boolean;

    if (hasAsset0In && hasAsset1Out) {
      // Standard direction: asset0 -> asset1
      fromAsset = firstAsset;
      toAsset = secondAsset;
      fromAmountBigInt = firstAssetInBigInt;
      toAmountBigInt = secondAssetOutBigInt;
      reversedAssetsOrder = false;
    } else if (hasAsset1In && hasAsset0Out) {
      // Reversed direction: asset1 -> asset0
      fromAsset = secondAsset;
      toAsset = firstAsset;
      fromAmountBigInt = secondAssetInBigInt;
      toAmountBigInt = firstAssetOutBigInt;
      reversedAssetsOrder = true;
    } else {
      // Fallback to original logic for edge cases
      const reversedAssetsOrderFallback =
        firstAssetInBigInt === BigInt(0) && secondAssetOutBigInt === BigInt(0);

      fromAsset = reversedAssetsOrderFallback ? secondAsset : firstAsset;
      toAsset = reversedAssetsOrderFallback ? firstAsset : secondAsset;
      fromAmountBigInt = reversedAssetsOrderFallback
        ? secondAssetInBigInt
        : firstAssetInBigInt;
      toAmountBigInt = reversedAssetsOrderFallback
        ? firstAssetOutBigInt
        : secondAssetOutBigInt;
      reversedAssetsOrder = reversedAssetsOrderFallback;
    }

    // Format amounts with proper decimal handling using BigInt
    const firstAssetAmount = formatAssetAmount(
      fromAmountBigInt,
      fromAsset.decimals
    );
    const secondAssetAmount = formatAssetAmount(
      toAmountBigInt,
      toAsset.decimals
    );

    return {
      firstAsset: fromAsset,
      secondAsset: toAsset,
      firstAssetAmount,
      secondAssetAmount,
      reversedAssetsOrder,
    };
  } else {
    // Handle ADD_LIQUIDITY and REMOVE_LIQUIDITY with proper BigInt calculations
    let firstAmountBigInt: bigint;
    let secondAmountBigInt: bigint;

    if (transaction.transaction_type === "ADD_LIQUIDITY") {
      firstAmountBigInt = firstAssetInBigInt;
      secondAmountBigInt = secondAssetInBigInt;
    } else {
      // REMOVE_LIQUIDITY
      firstAmountBigInt = firstAssetOutBigInt;
      secondAmountBigInt = secondAssetOutBigInt;
    }

    // Format amounts with proper decimal handling
    const firstAssetAmount = formatAssetAmount(
      firstAmountBigInt,
      firstAssetDecimals
    );
    const secondAssetAmount = formatAssetAmount(
      secondAmountBigInt,
      secondAssetDecimals
    );

    return {
      firstAssetAmount,
      secondAssetAmount,
      firstAsset,
      secondAsset,
      reversedAssetsOrder: false,
    };
  }
};

// Helper function to validate transaction type and amounts consistency
const validateTransactionTypeConsistency = (
  action: TransactionFromQuery
): boolean => {
  const amount0In = safeStringToBigInt(action.amount0In);
  const amount0Out = safeStringToBigInt(action.amount0Out);
  const amount1In = safeStringToBigInt(action.amount1In);
  const amount1Out = safeStringToBigInt(action.amount1Out);

  switch (action.type) {
    case "SWAP": {
      // For swaps, we should have either:
      // - asset0 in and asset1 out (asset0 -> asset1)
      // - asset1 in and asset0 out (asset1 -> asset0)
      // At least one input and one output should be non-zero
      const hasInput = amount0In > BigInt(0) || amount1In > BigInt(0);
      const hasOutput = amount0Out > BigInt(0) || amount1Out > BigInt(0);
      return hasInput && hasOutput;
    }

    case "ADD_LIQUIDITY":
      // For adding liquidity, both assets should have input amounts
      return amount0In > BigInt(0) && amount1In > BigInt(0);

    case "REMOVE_LIQUIDITY":
      // For removing liquidity, both assets should have output amounts
      return amount0Out > BigInt(0) && amount1Out > BigInt(0);

    default:
      return false;
  }
};

// Helper function to validate Subquid action data
const isValidSubquidAction = (action: any): action is TransactionFromQuery => {
  // Basic structure validation
  const isValidStructure =
    action &&
    typeof action.id === "string" &&
    typeof action.transaction === "string" &&
    typeof action.recipient === "string" &&
    typeof action.amount0In === "string" &&
    typeof action.amount0Out === "string" &&
    typeof action.amount1In === "string" &&
    typeof action.amount1Out === "string" &&
    ["ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "SWAP"].includes(action.type) &&
    action.asset0 &&
    typeof action.asset0.symbol === "string" &&
    typeof action.asset0.decimals === "number" &&
    action.asset1 &&
    typeof action.asset1.symbol === "string" &&
    typeof action.asset1.decimals === "number" &&
    (action.timestamp === undefined || typeof action.timestamp === "number");

  if (!isValidStructure) {
    return false;
  }

  // Validate transaction type consistency with amounts
  try {
    return validateTransactionTypeConsistency(action);
  } catch (error) {
    console.warn("Error validating transaction type consistency:", error);
    return false;
  }
};

// Interface for net asset flow calculation
interface AssetFlow {
  symbol: string;
  assetId: string;
  decimals: number;
  netAmount: bigint; // Using bigint for precise calculations
}

// Helper function to calculate net asset flows for multi-hop swaps
const calculateNetAssetFlows = (
  actions: TransactionFromQuery[],
  assets: CoinDataWithPrice[]
): AssetFlow[] => {
  const assetFlows = new Map<string, AssetFlow>();

  actions.forEach((action) => {
    // Process asset0
    const asset0 = findAssetBySymbol(action.asset0.symbol, assets);
    if (asset0 && asset0.assetId) {
      const asset0Key = asset0.assetId.toLowerCase();

      if (!assetFlows.has(asset0Key)) {
        assetFlows.set(asset0Key, {
          symbol: asset0.symbol,
          assetId: asset0.assetId,
          decimals: asset0.decimals,
          netAmount: BigInt(0),
        });
      }

      const flow = assetFlows.get(asset0Key)!;
      const amountIn = safeStringToBigInt(action.amount0In || "0");
      const amountOut = safeStringToBigInt(action.amount0Out || "0");

      // net_amount = amount_out - amount_in
      flow.netAmount += amountOut - amountIn;
    }

    // Process asset1
    const asset1 = findAssetBySymbol(action.asset1.symbol, assets);
    if (asset1 && asset1.assetId) {
      const asset1Key = asset1.assetId.toLowerCase();

      if (!assetFlows.has(asset1Key)) {
        assetFlows.set(asset1Key, {
          symbol: asset1.symbol,
          assetId: asset1.assetId,
          decimals: asset1.decimals,
          netAmount: BigInt(0),
        });
      }

      const flow = assetFlows.get(asset1Key)!;
      const amountIn = safeStringToBigInt(action.amount1In || "0");
      const amountOut = safeStringToBigInt(action.amount1Out || "0");

      // net_amount = amount_out - amount_in
      flow.netAmount += amountOut - amountIn;
    }
  });

  return Array.from(assetFlows.values());
};

// Helper function to create consolidated transaction from net flows
const createConsolidatedTransaction = (
  txHash: string,
  actions: TransactionFromQuery[],
  netFlows: AssetFlow[],
  assets: CoinDataWithPrice[]
): Transaction => {
  // Filter out intermediate assets (net amount = 0) and get input/output assets
  const significantFlows = netFlows.filter(
    (flow) => flow.netAmount !== BigInt(0)
  );

  // Separate input assets (negative net amounts) and output assets (positive net amounts)
  const inputAssets = significantFlows.filter(
    (flow) => flow.netAmount < BigInt(0)
  );
  const outputAssets = significantFlows.filter(
    (flow) => flow.netAmount > BigInt(0)
  );

  // Use the first action for metadata
  const primaryAction = actions[0];
  const blockTime = primaryAction.timestamp || Math.floor(Date.now() / 1000);

  // For multi-hop swaps, we need to create a consolidated transaction
  // We'll use the first input asset and first output asset as the primary pair
  let asset0: CoinDataWithPrice | undefined;
  let asset1: CoinDataWithPrice | undefined;
  let asset0In = "0";
  let asset0Out = "0";
  let asset1In = "0";
  let asset1Out = "0";

  if (inputAssets.length > 0 && outputAssets.length > 0) {
    // This is a swap transaction
    const inputAsset = inputAssets[0];
    const outputAsset = outputAssets[0];

    // Find the full asset data from the assets list
    asset0 =
      findAssetBySymbol(inputAsset.symbol, assets) ||
      ({
        symbol: inputAsset.symbol,
        assetId: inputAsset.assetId,
        decimals: inputAsset.decimals,
      } as CoinDataWithPrice);

    asset1 =
      findAssetBySymbol(outputAsset.symbol, assets) ||
      ({
        symbol: outputAsset.symbol,
        assetId: outputAsset.assetId,
        decimals: outputAsset.decimals,
      } as CoinDataWithPrice);

    // Convert negative net amount to positive for input
    asset0In = (-inputAsset.netAmount).toString();
    asset1Out = outputAsset.netAmount.toString();
  } else {
    // Fallback to original logic for non-swap transactions or edge cases
    const firstAction = actions[0];
    asset0 = findAssetBySymbol(firstAction.asset0.symbol, assets);
    asset1 = findAssetBySymbol(firstAction.asset1.symbol, assets);

    if (!asset0 || !asset1) {
      // Create minimal asset objects if not found
      asset0 =
        asset0 ||
        ({
          symbol: firstAction.asset0.symbol,
          assetId: `unknown_${firstAction.asset0.symbol}`,
          decimals: firstAction.asset0.decimals,
        } as CoinDataWithPrice);

      asset1 =
        asset1 ||
        ({
          symbol: firstAction.asset1.symbol,
          assetId: `unknown_${firstAction.asset1.symbol}`,
          decimals: firstAction.asset1.decimals,
        } as CoinDataWithPrice);
    }

    asset0In = firstAction.amount0In || "0";
    asset0Out = firstAction.amount0Out || "0";
    asset1In = firstAction.amount1In || "0";
    asset1Out = firstAction.amount1Out || "0";
  }

  // Create pool_id from asset IDs
  const poolId = `${asset0.assetId}_${asset1.assetId}`;

  return {
    tx_id: txHash,
    asset_0_in: asset0In,
    asset_0_out: asset0Out,
    asset_1_in: asset1In,
    asset_1_out: asset1Out,
    block_time: blockTime,
    pool_id: poolId,
    transaction_type: primaryAction.type,
    extra: [], // No extra transactions needed for consolidated view
  };
};

// Helper function to transform Subquid response to internal format
const transformSubquidResponseToInternalFormat = (
  data: TransactionsDataFromQuery,
  assets: CoinDataWithPrice[]
): TransactionsData => {
  try {
    // Validate input data
    if (!data || !Array.isArray(data.actions)) {
      console.warn("Invalid Subquid response data:", data);
      return {Transaction: []};
    }

    // Filter and validate actions
    const validActions = data.actions.filter((action) => {
      if (!isValidSubquidAction(action)) {
        console.warn("Invalid action data from Subquid:", action);
        return false;
      }
      return true;
    });

    if (validActions.length === 0) {
      return {Transaction: []};
    }

    // Group actions by transaction hash to identify multi-hop swaps
    const transactionGroups = new Map<string, TransactionFromQuery[]>();

    validActions.forEach((action) => {
      const txHash = action.transaction;
      if (!txHash) {
        console.warn("Action missing transaction hash:", action);
        return;
      }

      if (!transactionGroups.has(txHash)) {
        transactionGroups.set(txHash, []);
      }
      transactionGroups.get(txHash)!.push(action);
    });

    const transformedTransactions: Transaction[] = [];

    transactionGroups.forEach((actions, txHash) => {
      try {
        // Sort actions by id to ensure consistent ordering
        const sortedActions = actions.sort((a, b) => a.id.localeCompare(b.id));

        // Check if this is a multi-hop swap (multiple SWAP actions in same transaction)
        const swapActions = sortedActions.filter(
          (action) => action.type === "SWAP"
        );
        const isMultiHopSwap = swapActions.length > 1;

        if (isMultiHopSwap) {
          // Use net asset flow calculation for multi-hop swaps
          const netFlows = calculateNetAssetFlows(swapActions, assets);
          const consolidatedTransaction = createConsolidatedTransaction(
            txHash,
            swapActions,
            netFlows,
            assets
          );
          transformedTransactions.push(consolidatedTransaction);
        } else {
          // Handle single transactions using existing logic
          const primaryAction = sortedActions[0];

          // Find matching assets for pool_id construction
          const asset0 = findAssetBySymbol(primaryAction.asset0.symbol, assets);
          const asset1 = findAssetBySymbol(primaryAction.asset1.symbol, assets);

          if (!asset0 || !asset1) {
            console.warn(`Assets not found for transaction ${txHash}:`, {
              asset0Symbol: primaryAction.asset0.symbol,
              asset1Symbol: primaryAction.asset1.symbol,
              availableAssets: assets.map((a) => ({
                symbol: a.symbol,
                assetId: a.assetId,
              })),
            });
            return; // Skip this transaction if assets not found
          }

          // Validate asset IDs
          if (!asset0.assetId || !asset1.assetId) {
            console.warn(`Invalid asset IDs for transaction ${txHash}:`, {
              asset0: asset0,
              asset1: asset1,
            });
            return;
          }

          // Create pool_id from asset IDs
          const poolId = `${asset0.assetId}_${asset1.assetId}`;

          // Use timestamp from Subquid, with current time as fallback
          const blockTime =
            primaryAction.timestamp || Math.floor(Date.now() / 1000);

          // Validate numeric fields and provide defaults
          const safeAmount0In = primaryAction.amount0In || "0";
          const safeAmount0Out = primaryAction.amount0Out || "0";
          const safeAmount1In = primaryAction.amount1In || "0";
          const safeAmount1Out = primaryAction.amount1Out || "0";

          // Create the transaction
          const transaction: Transaction = {
            tx_id: txHash,
            asset_0_in: safeAmount0In,
            asset_0_out: safeAmount0Out,
            asset_1_in: safeAmount1In,
            asset_1_out: safeAmount1Out,
            block_time: blockTime,
            pool_id: poolId,
            transaction_type: primaryAction.type,
            extra: [],
          };

          transformedTransactions.push(transaction);
        }
      } catch (error) {
        console.error(`Error processing transaction group ${txHash}:`, error);
      }
    });

    return {
      Transaction: transformedTransactions,
    };
  } catch (error) {
    console.error("Error transforming Subquid response:", error);
    return {Transaction: []};
  }
};

// Helper function to find asset by symbol
const findAssetBySymbol = (
  symbol: string,
  assets: CoinDataWithPrice[]
): CoinDataWithPrice | undefined => {
  return assets.find(
    (asset) => asset.symbol.toLowerCase() === symbol.toLowerCase()
  );
};

// Helper function to create the transaction object
const createTransactionObject = (
  transaction: Transaction,
  date: string,
  assetAmounts: AssetsAmounts
): TransactionProps => {
  let name: string;

  if (transaction.transaction_type === "ADD_LIQUIDITY") {
    name = "Added liquidity";
  } else if (transaction.transaction_type === "REMOVE_LIQUIDITY") {
    name = "Removed liquidity";
  } else {
    name = "Swap";
  }

  return {
    ...assetAmounts,
    date,
    name,
    withdrawal: transaction.transaction_type === "REMOVE_LIQUIDITY",
    addLiquidity: transaction.transaction_type === "ADD_LIQUIDITY",
    tx_id: transaction.tx_id,
  };
};

export function useWalletTransactions(
  account: B256Address | null,
  fetchCondition: boolean
): {
  transactions: Record<string, TransactionProps[]>;
  isLoading: boolean;
} {
  const {assets, isLoading: isAssetsLoading} = useAssetList();

  const shouldFetch = Boolean(account) && Boolean(fetchCondition);

  const {data: indexerData, isLoading} = useIndexerWalletTransactions(
    shouldFetch ? account?.toLowerCase() || "" : "",
    200
  );

  // Transform indexer data to match expected format
  const data = useMemo(() => {
    if (!indexerData) return undefined;

    return {
      actions: indexerData.map((tx) => ({
        id: tx.id,
        amount0In: tx.data?.amounts?.amount0In || "0",
        amount0Out: tx.data?.amounts?.amount0Out || "0",
        amount1In: tx.data?.amounts?.amount1In || "0",
        amount1Out: tx.data?.amounts?.amount1Out || "0",
        type: tx.type as "ADD_LIQUIDITY" | "REMOVE_LIQUIDITY" | "SWAP",
        asset0: {
          symbol: tx.data?.pool?.asset0?.symbol || "",
          decimals: tx.data?.pool?.asset0?.decimals || 18,
        },
        asset1: {
          symbol: tx.data?.pool?.asset1?.symbol || "",
          decimals: tx.data?.pool?.asset1?.decimals || 18,
        },
        transaction: tx.hash,
        recipient: tx.from,
        timestamp: tx.timestamp,
      })),
    } as TransactionsDataFromQuery;
  }, [indexerData]);

  const transactions = useMemo(() => {
    if (!data || !assets?.length) return {};

    // Transform Subquid response to internal format
    const transformedData = transformSubquidResponseToInternalFormat(
      data,
      assets
    );

    return transformTransactionsDataAndGroupByDate(transformedData, assets);
  }, [assets, data]);

  return {transactions, isLoading: isAssetsLoading || isLoading};
}
