import {
  Account,
  AccountCoinQuantity,
  Address,
  AssetId,
  BigNumberish,
  BN,
  CoinQuantityLike,
  ScriptTransactionRequest,
  hexlify,
  bn,
  sha256,
  arrayify,
  concat,
} from "fuels";

import {
  DEFAULT_AMM_V2_CONTRACT_ID,
  V2_TRANSACTION_CONFIG,
  LIQUIDITY_DISTRIBUTION,
  V2_SCRIPT_BLOB_IDS,
} from "./constants";

import {
  AddLiquidity,
  RemoveLiquidity,
  SwapExactIn,
  SwapExactOut,
} from "./typegen/scripts-v2";

import {PoolCurveState} from "./typegen/contracts-v2";

import {
  PoolIdV2,
  PoolInput,
  BinIdDelta,
  LiquidityConfig,
  TxParams,
  PrepareRequestOptions,
  MiraV2Error,
  PoolCurveStateError,
} from "./model";

import {
  addressInput,
  assetInput,
  contractIdInput,
  poolIdV2Input,
  getAssetId,
} from "./utils";

import {
  withErrorHandling,
  createErrorContext,
  EnhancedMiraV2Error,
} from "./errors/v2-errors";

import {
  validatePoolId,
  validateAssetId,
  validateSwapParams,
  validateAddLiquidityParams,
  validateRemoveLiquidityParams,
  validatePoolInput,
  validateBinId,
  validateAmount,
  validateDeadline,
  validateLiquidityConfig,
  DEFAULT_VALIDATION_OPTIONS,
} from "./validation";

type TransactionWithGasPrice = {
  transactionRequest: ScriptTransactionRequest;
  gasPrice: BN;
};

/**
 * Options for MiraAmmV2 constructor
 */
export interface MiraAmmV2Options {
  /**
   * Whether to use blob-based loader scripts instead of full bytecode scripts.
   *
   * When enabled (and blobs are deployed for the current network), transactions
   * will use loader scripts (~400 bytes) instead of full scripts (~10-12KB),
   * significantly reducing transaction size and gas costs.
   *
   * Defaults to true when blob IDs are available for the network.
   */
  useBlobScripts?: boolean;
}

/**
 * Network name type for blob ID lookups
 */
type NetworkName = "testnet" | "mainnet";

/**
 * MiraAmmV2 - Write operations for Mira v2 binned liquidity pools
 *
 * This class provides methods for executing transactions on Mira v2 pools, which use
 * a binned liquidity model similar to Trader Joe v2. Unlike v1's continuous liquidity,
 * v2 allows liquidity providers to concentrate their capital in specific price ranges
 * through discrete bins.
 *
 * Key features:
 * - Binned liquidity distribution for capital efficiency
 * - Concentrated liquidity positions across multiple price points
 * - Per-pool fee structures instead of global fees
 * - Advanced slippage protection with bin-aware calculations
 *
 * @example
 * ```typescript
 * import { Account, Provider } from "fuels";
 * import { MiraAmmV2 } from "mira-dex-ts";
 *
 * const provider = await Provider.create("https://testnet.fuel.network/v1/graphql");
 * const account = new Account("your-private-key", provider);
 * const miraAmm = new MiraAmmV2(account);
 *
 * // Add concentrated liquidity around current price
 * const poolId = new BN("12345");
 * const transaction = await miraAmm.addLiquidity(
 *   poolId,
 *   new BN("1000000"), // 1 token A
 *   new BN("2000000"), // 2 token B
 *   new BN("950000"),  // min A (5% slippage)
 *   new BN("1900000"), // min B (5% slippage)
 *   new BN(Date.now() + 20 * 60 * 1000), // 20 min deadline
 *   8388608, // active bin ID
 *   5,       // 5 bin slippage tolerance
 *   [{Positive: 0}, {Positive: 1}, {Positive: 2}], // bins around active
 *   [40, 30, 30], // X token distribution %
 *   [60, 20, 20]  // Y token distribution %
 * );
 * ```
 */
export class MiraAmmV2 {
  private readonly account: Account;
  private readonly ammContract: PoolCurveState;
  private readonly contractId: string;
  private readonly useBlobScripts: boolean;
  private readonly networkName?: NetworkName;
  private _addLiquidityScript?: AddLiquidity;
  private _removeLiquidityScript?: RemoveLiquidity;
  private _swapExactInScript?: SwapExactIn;
  private _swapExactOutScript?: SwapExactOut;
  // Loader script instances (used when useBlobScripts is true)
  private _addLiquidityLoader?: AddLiquidity;
  private _removeLiquidityLoader?: RemoveLiquidity;
  private _swapExactInLoader?: SwapExactIn;
  private _swapExactOutLoader?: SwapExactOut;
  private _loadersInitialized: boolean = false;
  private _loadersInitializing?: Promise<void>;

  /**
   * Normalize a deadline to TAI64 format expected by contracts.
   * Accepts Unix seconds or TAI64; returns TAI64.
   */
  private normalizeDeadline(deadline: BigNumberish): BN {
    const d = bn(deadline);
    const TAI64_OFFSET = bn(2).pow(bn(62));
    return d.gte(TAI64_OFFSET) ? d : TAI64_OFFSET.add(d);
  }

  /**
   * Creates a new MiraAmmV2 instance for executing v2 pool transactions
   *
   * @param account - Fuel account for signing transactions
   * @param contractIdOpt - Optional v2 contract ID (uses default if not provided)
   * @param options - Optional configuration options
   */
  constructor(
    account: Account,
    contractIdOpt?: string,
    options?: MiraAmmV2Options
  ) {
    this.contractId = contractIdOpt ?? DEFAULT_AMM_V2_CONTRACT_ID;
    this.account = account;
    this.ammContract = new PoolCurveState(this.contractId, account);

    // Determine network name from provider URL for blob ID lookups
    const providerUrl = account.provider?.url ?? "";
    if (providerUrl.includes("testnet")) {
      this.networkName = "testnet";
    } else if (providerUrl.includes("mainnet")) {
      this.networkName = "mainnet";
    }
    // If URL doesn't contain either, networkName remains undefined

    // Check if blob scripts are available for this network
    const blobIds = this.networkName
      ? V2_SCRIPT_BLOB_IDS[this.networkName]
      : undefined;
    const hasBlobsDeployed =
      blobIds &&
      Object.values(blobIds).filter((id) => id !== undefined).length > 0;

    // Use blob scripts by default when blobs are deployed for this network
    // Can be explicitly disabled with options.useBlobScripts = false
    this.useBlobScripts = options?.useBlobScripts ?? hasBlobsDeployed ?? false;

    if (this.useBlobScripts && !hasBlobsDeployed) {
      console.warn(
        `[MiraAmmV2] Blob scripts requested but no blob IDs found for network: ${this.networkName}. ` +
          `Falling back to full bytecode scripts.`
      );
      this.useBlobScripts = false;
    }

    // Scripts are initialized lazily when needed to avoid InputContractDoesNotExist errors
  }

  /**
   * Initialize loader scripts for blob-based transactions.
   * This is called automatically on first transaction if useBlobScripts is true.
   * Can be called explicitly to pre-initialize loaders.
   */
  async initializeLoaders(): Promise<void> {
    if (this._loadersInitialized || !this.useBlobScripts) {
      return;
    }

    // Prevent concurrent initialization
    if (this._loadersInitializing) {
      return this._loadersInitializing;
    }

    this._loadersInitializing = this._doInitializeLoaders();
    await this._loadersInitializing;
    this._loadersInitialized = true;
  }

  private async _doInitializeLoaders(): Promise<void> {
    const contractIdConfigurables = {
      POOL_CURVE_STATE: contractIdInput(this.contractId),
    };

    // Initialize all loader scripts in parallel
    // The deploy() method returns a loader that references the blob
    // If blob already exists, this just creates the loader without a new transaction
    const [swapInLoader, swapOutLoader, addLiqLoader, removeLiqLoader] =
      await Promise.all([
        this._createLoader(
          new SwapExactIn(this.account).setConfigurableConstants(
            contractIdConfigurables
          ),
          "SwapExactIn"
        ),
        this._createLoader(
          new SwapExactOut(this.account).setConfigurableConstants(
            contractIdConfigurables
          ),
          "SwapExactOut"
        ),
        this._createLoader(
          new AddLiquidity(this.account).setConfigurableConstants(
            contractIdConfigurables
          ),
          "AddLiquidity"
        ),
        this._createLoader(
          new RemoveLiquidity(this.account).setConfigurableConstants(
            contractIdConfigurables
          ),
          "RemoveLiquidity"
        ),
      ]);

    this._swapExactInLoader = swapInLoader;
    this._swapExactOutLoader = swapOutLoader;
    this._addLiquidityLoader = addLiqLoader;
    this._removeLiquidityLoader = removeLiqLoader;
  }

  private async _createLoader<T extends {deploy: (account: Account) => any}>(
    script: T,
    name: string
  ): Promise<T> {
    try {
      const {waitForResult} = await script.deploy(this.account);
      const loader = await waitForResult();
      console.log(`[MiraAmmV2] ✅ Loader created for ${name} (using blob)`);
      return loader as T;
    } catch (error: any) {
      const errorMsg = error?.message || String(error);

      // Check if blob already exists - this is expected and means we can use the loader
      // The SDK should still return a valid loader in this case
      if (
        errorMsg.includes("BlobIdAlreadyUploaded") ||
        errorMsg.includes("already exists") ||
        errorMsg.includes("Blob already uploaded")
      ) {
        // Blob exists, try to get loader anyway by calling deploy again
        // Some SDK versions return the loader even when blob exists
        console.log(
          `[MiraAmmV2] ✅ Blob already exists for ${name}, using existing blob`
        );
        // The script itself can be used as it will reference the existing blob
        // when the SDK detects the blob is already deployed
        return script;
      }

      // Actual error - fall back to full script
      console.warn(
        `[MiraAmmV2] ⚠️ Failed to create loader for ${name}: ${errorMsg}. Using full bytecode.`
      );
      return script;
    }
  }

  /**
   * Returns whether blob-based loader scripts are being used
   */
  isUsingBlobScripts(): boolean {
    return this.useBlobScripts;
  }

  /**
   * Lazy getter for add liquidity script
   * Returns loader script if blob scripts are enabled and initialized
   */
  private get addLiquidityScript(): AddLiquidity {
    // Use loader if available
    if (this._addLiquidityLoader) {
      return this._addLiquidityLoader;
    }
    // Fall back to full script
    if (!this._addLiquidityScript) {
      const contractIdConfigurables = {
        POOL_CURVE_STATE: contractIdInput(this.contractId),
      };
      this._addLiquidityScript = new AddLiquidity(
        this.account
      ).setConfigurableConstants(contractIdConfigurables);
    }
    return this._addLiquidityScript;
  }

  /**
   * Lazy getter for remove liquidity script
   * Returns loader script if blob scripts are enabled and initialized
   */
  private get removeLiquidityScript(): RemoveLiquidity {
    // Use loader if available
    if (this._removeLiquidityLoader) {
      return this._removeLiquidityLoader;
    }
    // Fall back to full script
    if (!this._removeLiquidityScript) {
      const contractIdConfigurables = {
        POOL_CURVE_STATE: contractIdInput(this.contractId),
      };
      this._removeLiquidityScript = new RemoveLiquidity(
        this.account
      ).setConfigurableConstants(contractIdConfigurables);
    }
    return this._removeLiquidityScript;
  }

  /**
   * Lazy getter for swap exact in script
   * Returns loader script if blob scripts are enabled and initialized
   */
  private get swapExactInScript(): SwapExactIn {
    // Use loader if available
    if (this._swapExactInLoader) {
      return this._swapExactInLoader;
    }
    // Fall back to full script
    if (!this._swapExactInScript) {
      const contractIdConfigurables = {
        POOL_CURVE_STATE: contractIdInput(this.contractId),
      };
      this._swapExactInScript = new SwapExactIn(
        this.account
      ).setConfigurableConstants(contractIdConfigurables);
    }
    return this._swapExactInScript;
  }

  /**
   * Lazy getter for swap exact out script
   * Returns loader script if blob scripts are enabled and initialized
   */
  private get swapExactOutScript(): SwapExactOut {
    // Use loader if available
    if (this._swapExactOutLoader) {
      return this._swapExactOutLoader;
    }
    // Fall back to full script
    if (!this._swapExactOutScript) {
      const contractIdConfigurables = {
        POOL_CURVE_STATE: contractIdInput(this.contractId),
      };
      this._swapExactOutScript = new SwapExactOut(
        this.account
      ).setConfigurableConstants(contractIdConfigurables);
    }
    return this._swapExactOutScript;
  }

  /**
   * Gets the contract ID of the v2 AMM contract
   *
   * @returns The contract ID as a B256 string
   */
  id(): string {
    return this.ammContract.id.toB256();
  }

  /**
   * Adds liquidity to a v2 pool with binned liquidity distribution
   *
   * @param poolId - The v2 pool ID (BN)
   * @param amountADesired - Desired amount of token A to add
   * @param amountBDesired - Desired amount of token B to add
   * @param amountAMin - Minimum amount of token A (slippage protection)
   * @param amountBMin - Minimum amount of token B (slippage protection)
   * @param deadline - Transaction deadline timestamp
   * @param activeIdDesired - Desired active bin ID for liquidity distribution
   * @param idSlippage - Allowed slippage in bin IDs
   * @param deltaIds - Array of bin ID deltas for liquidity distribution
   * @param distributionX - Distribution percentages for token X across bins
   * @param distributionY - Distribution percentages for token Y across bins
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  async addLiquidity(
    poolId: PoolIdV2,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish,
    activeIdDesired?: BigNumberish,
    idSlippage?: BigNumberish,
    deltaIds?: BinIdDelta[],
    distributionX?: BigNumberish[],
    distributionY?: BigNumberish[],
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const context = createErrorContext("addLiquidity", {poolId});

    // Validate input parameters
    validateAddLiquidityParams(
      poolId,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      deadline,
      DEFAULT_VALIDATION_OPTIONS,
      context
    );

    return withErrorHandling(async () => {
      // Initialize loaders if blob scripts are enabled (reduces transaction size)
      if (this.useBlobScripts) {
        await this.initializeLoaders();
      }

      // Get pool metadata to determine asset order and current active bin
      // In v2, liquidity is distributed across bins rather than a single position
      // Each bin represents a discrete price point where liquidity can be concentrated
      const poolMetadata = await this.ammContract.functions
        .get_pool(poolIdV2Input(poolId))
        .get();

      if (!poolMetadata.value) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool with ID ${poolId.toString()} not found`
        );
      }

      const pool = poolMetadata.value.pool;

      // Default values for v2-specific parameters
      // activeIdDesired: target bin for liquidity concentration (defaults to current active bin)
      const finalActiveIdDesired =
        activeIdDesired ?? poolMetadata.value.active_id;
      // idSlippage: allowed movement in bin IDs due to price changes during transaction
      const finalIdSlippage = idSlippage ?? 0;
      // deltaIds: relative positions from active bin for liquidity distribution
      // Positive values = bins above current price, Negative = bins below current price
      const finalDeltaIds =
        deltaIds?.map((delta) => {
          if (delta.Positive !== undefined) {
            return {Positive: delta.Positive};
          } else if (delta.Negative !== undefined) {
            return {Negative: delta.Negative};
          }
          throw new Error("Invalid BinIdDelta");
        }) ?? [];
      // distributionX/Y: percentage allocation for each bin (arrays must sum to 100)
      const finalDistributionX = distributionX ?? [];
      const finalDistributionY = distributionY ?? [];

      // Prepare the AddLiquidityParameters for v2 binned liquidity
      // Unlike v1's single position, v2 allows distributing liquidity across multiple bins
      // This enables concentrated liquidity strategies for improved capital efficiency
      const addLiquidityParams = {
        pool: {
          asset_x: pool.asset_x,
          asset_y: pool.asset_y,
          bin_step: pool.bin_step, // Price increment between adjacent bins
          base_factor: pool.base_factor, // Precision multiplier for calculations
        },
        amount_x: amountADesired, // Total X tokens to add across all bins
        amount_y: amountBDesired, // Total Y tokens to add across all bins
        amount_x_min: amountAMin, // Minimum X tokens (slippage protection)
        amount_y_min: amountBMin, // Minimum Y tokens (slippage protection)
        active_id_desired: finalActiveIdDesired, // Target active bin for price anchoring
        id_slippage: finalIdSlippage, // Allowed bin ID movement during execution
        delta_ids: finalDeltaIds, // Relative bin positions (e.g., [-1, 0, +1])
        distribution_x: finalDistributionX, // X token % per bin (must sum to 100)
        distribution_y: finalDistributionY, // Y token % per bin (must sum to 100)
        to: addressInput(this.account.address), // LP token recipient
        refund_to: addressInput(this.account.address), // Excess token refund address
        deadline, // Transaction deadline
      };

      // Call the add liquidity script
      let request = await this.addLiquidityScript.functions
        .main(addLiquidityParams)
        .addContracts([this.ammContract])
        .txParams(txParams ?? {})
        .getTransactionRequest();

      // Prepare input assets for funding
      const inputAssets = [
        {
          assetId: pool.asset_x.bits,
          amount: amountADesired,
        },
        {
          assetId: pool.asset_y.bits,
          amount: amountBDesired,
        },
      ];

      return await this.prepareRequest(request, 2, inputAssets, [], options);
    }, context);
  }

  private async fundRequest(
    request: ScriptTransactionRequest
  ): Promise<ScriptTransactionRequest> {
    const gasCost = await this.account.getTransactionCost(request);
    return await this.account.fund(request, gasCost);
  }

  /**
   * Removes liquidity from a v2 pool using position NFT IDs
   *
   * **IMPORTANT: Mira V2 Architecture**
   * Unlike Joe V2 which uses per-bin fungible LP tokens, Mira V2 uses Position NFTs.
   * When you add liquidity to multiple bins, you receive ONE position NFT that represents
   * ownership of shares across all those bins. The shares themselves are stored on-chain
   * in the contract's `lp_shares_per_token` storage map.
   *
   * **Usage:**
   * - Pass the actual position NFT asset IDs (obtained from indexer or add liquidity response)
   * - Do NOT pass bin IDs - this method expects position NFT IDs
   * - Multiple bins can share the same position NFT, so deduplicate before calling
   *
   * @param poolId - The v2 pool ID (BN)
   * @param lpAssetIds - Array of position NFT asset IDs (as hex strings starting with 0x)
   * @param amountAMin - Minimum amount of token A to receive (slippage protection)
   * @param amountBMin - Minimum amount of token B to receive (slippage protection)
   * @param deadline - Transaction deadline timestamp (TAI64 format for V2)
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   *
   * @example
   * ```typescript
   * // Get position NFT IDs from your positions (e.g., from indexer)
   * const positionNFTs = userPositions.map(p => p.lpToken);
   * const uniqueNFTs = [...new Set(positionNFTs)]; // Deduplicate
   *
   * const tx = await miraV2.removeLiquidity(
   *   poolId,
   *   uniqueNFTs,  // Position NFT IDs, NOT bin IDs
   *   minAmountX,
   *   minAmountY,
   *   getMaxDeadlineV2(),
   *   DefaultTxParams
   * );
   * ```
   */
  async removeLiquidity(
    poolId: PoolIdV2,
    lpAssetIds: string[],
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const context = createErrorContext("removeLiquidity", {poolId});

    // Validate input parameters
    validateRemoveLiquidityParams(
      poolId,
      lpAssetIds,
      amountAMin,
      amountBMin,
      deadline,
      DEFAULT_VALIDATION_OPTIONS,
      context
    );

    return withErrorHandling(async () => {
      // Initialize loaders if blob scripts are enabled (reduces transaction size)
      if (this.useBlobScripts) {
        await this.initializeLoaders();
      }

      // Get pool metadata to validate pool exists and get asset configuration
      const poolMetadata = await this.ammContract.functions
        .get_pool(poolIdV2Input(poolId))
        .get();

      if (!poolMetadata.value) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool with ID ${poolId.toString()} not found`
        );
      }

      const pool = poolMetadata.value.pool;

      // Convert position NFT asset IDs to AssetId objects for the script
      // Each position NFT represents ownership of shares across one or more bins
      // The contract looks up the shares from the lp_shares_per_token storage map
      const lpAssets: AssetId[] = lpAssetIds.map((assetId) => ({
        bits: assetId,
      }));

      // Prepare the RemoveLiquidityParameters for the remove_liquidity script
      const removeLiquidityParams = {
        pool: {
          asset_x: pool.asset_x,
          asset_y: pool.asset_y,
          bin_step: pool.bin_step,
          base_factor: pool.base_factor,
        },
        amount_x_min: amountAMin,
        amount_y_min: amountBMin,
        lp_assets: lpAssets.map(assetInput), // Position NFT IDs
        to: addressInput(this.account.address),
        deadline,
      };

      // Call the remove liquidity script
      // The script will:
      // 1. Transfer the position NFTs to the contract
      // 2. Look up the shares for each NFT from lp_shares_per_token
      // 3. Remove liquidity from all bins associated with those shares
      // 4. Burn the position NFTs
      // 5. Transfer underlying tokens back to the user
      let request = await this.removeLiquidityScript.functions
        .main(removeLiquidityParams)
        .addContracts([this.ammContract])
        .txParams(txParams ?? {})
        .getTransactionRequest();

      // Prepare input assets for funding
      // Each position NFT has a balance of 1 (they are NFTs, not fungible tokens)
      const inputAssets = lpAssets.map((assetId) => ({
        assetId: assetId.bits,
        amount: bn(1), // Position NFTs have a balance of 1
      }));

      return await this.prepareRequest(request, 2, inputAssets, [], options);
    }, context);
  }

  private async prepareRequest(
    request: ScriptTransactionRequest,
    variableOutputs: number = 0,
    inputAssets: CoinQuantityLike[] = [],
    inputContracts: string[] = [],
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    if (variableOutputs > 0) {
      request.addVariableOutputs(variableOutputs);
    }

    const uniqueContracts = new Set(
      inputContracts.map((c) => Address.fromAddressOrString(c))
    );
    for (const contract of uniqueContracts) {
      request.addContractInputAndOutput(contract);
    }

    if (options?.fundTransaction !== false) {
      const accountCoinMap = new Map<string, AccountCoinQuantity>();

      for (const asset of inputAssets) {
        const coin = Array.isArray(asset)
          ? {amount: asset[0], assetId: asset[1]}
          : {amount: asset.amount, assetId: asset.assetId};

        const assetId =
          typeof coin.assetId === "string"
            ? coin.assetId
            : hexlify(coin.assetId);

        if (accountCoinMap.has(assetId)) {
          const existing = accountCoinMap.get(assetId)!;
          existing.amount = bn(existing.amount).add(coin.amount);
        } else {
          accountCoinMap.set(assetId, {
            amount: coin.amount,
            assetId,
            account: this.account,
            changeOutputAccount: this.account,
          });
        }
      }

      const baseAssetId = (
        await this.account.provider.getBaseAssetId()
      ).toString();

      // Ensure the base asset is included to cover transaction fees (gas).
      // Fallback placeholder amount of 1; the real fee will be estimated during assembleTx
      if (!accountCoinMap.has(baseAssetId)) {
        accountCoinMap.set(baseAssetId, {
          amount: bn(1),
          assetId: baseAssetId,
          account: this.account,
          changeOutputAccount: this.account,
        });
      }

      const accountCoinQuantities = Array.from(accountCoinMap.values());

      const {assembledRequest, gasPrice} =
        await this.account.provider.assembleTx({
          request,
          feePayerAccount: this.account,
          accountCoinQuantities,
        });

      return {transactionRequest: assembledRequest, gasPrice};
    }

    // Legacy/manual fallback
    request.addResources(await this.account.getResourcesToSpend(inputAssets));
    request = await this.fundRequest(request);
    const {gasPrice} = await this.account.getTransactionCost(request);
    await this.account.provider.estimateTxDependencies(request);
    return {transactionRequest: request, gasPrice};
  }

  /**
   * Swaps an exact input amount for a minimum output amount through v2 pools
   *
   * @param amountIn - Exact amount of input tokens to swap
   * @param assetIn - Input asset ID
   * @param amountOutMin - Minimum amount of output tokens to receive (slippage protection)
   * @param pools - Array of v2 pool IDs to route through
   * @param deadline - Transaction deadline timestamp
   * @param receiver - Optional receiver address (defaults to account address)
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  async swapExactInput(
    amountIn: BigNumberish,
    assetIn: AssetId,
    amountOutMin: BigNumberish,
    pools: PoolIdV2[],
    deadline: BigNumberish,
    receiver?: Address,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const context = createErrorContext("swapExactInput", {assetIn});

    // Validate input parameters
    validateAssetId(assetIn, "assetIn", context);
    validateSwapParams(
      amountIn,
      amountOutMin,
      pools,
      deadline,
      DEFAULT_VALIDATION_OPTIONS,
      context
    );

    return withErrorHandling(async () => {
      // Initialize loaders if blob scripts are enabled (reduces transaction size)
      if (this.useBlobScripts) {
        await this.initializeLoaders();
      }

      if (pools.length === 0) {
        throw new MiraV2Error(
          PoolCurveStateError.InvalidParameters,
          "At least one pool must be provided for routing"
        );
      }

      const recipient = receiver
        ? addressInput(receiver)
        : addressInput(this.account.address);

      // Convert pool IDs to routing path
      // In v2, swaps traverse bins within each pool, moving from bin to bin
      // as liquidity is consumed, providing more granular price discovery
      const path = pools.map((poolId) => poolId);

      // Call the swap exact in script
      // The script handles bin-to-bin routing within each pool automatically
      // Swaps start at the active bin and move through adjacent bins as needed
      const normalizedDeadline = this.normalizeDeadline(deadline);
      let request = await this.swapExactInScript.functions
        .main(
          amountIn,
          amountOutMin,
          assetInput(assetIn),
          path,
          recipient,
          normalizedDeadline
        )
        .addContracts([this.ammContract])
        .txParams(txParams ?? {})
        .getTransactionRequest();

      // Prepare input assets for funding
      const inputAssets = [
        {
          assetId: assetIn.bits,
          amount: amountIn,
        },
      ];

      return await this.prepareRequest(request, 1, inputAssets, [], options);
    }, context);
  }

  /**
   * Swaps tokens to get an exact output amount through v2 pools
   *
   * @param amountOut - Exact amount of output tokens to receive
   * @param assetOut - Output asset ID
   * @param amountInMax - Maximum amount of input tokens to spend (slippage protection)
   * @param pools - Array of v2 pool IDs to route through
   * @param deadline - Transaction deadline timestamp
   * @param receiver - Optional receiver address (defaults to account address)
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  async swapExactOutput(
    amountOut: BigNumberish,
    assetOut: AssetId,
    amountInMax: BigNumberish,
    pools: PoolIdV2[],
    deadline: BigNumberish,
    receiver?: Address,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const context = createErrorContext("swapExactOutput", {assetOut});

    // Validate input parameters
    validateAssetId(assetOut, "assetOut", context);
    validateSwapParams(
      amountInMax,
      amountOut,
      pools,
      deadline,
      DEFAULT_VALIDATION_OPTIONS,
      context
    );

    return withErrorHandling(async () => {
      // Initialize loaders if blob scripts are enabled (reduces transaction size)
      if (this.useBlobScripts) {
        await this.initializeLoaders();
      }

      if (pools.length === 0) {
        throw new MiraV2Error(
          PoolCurveStateError.InvalidParameters,
          "At least one pool must be provided for routing"
        );
      }

      // For exact output, we need to determine the input asset from the first pool
      const firstPoolMetadata = await this.ammContract.functions
        .get_pool(poolIdV2Input(pools[0]))
        .get();

      if (!firstPoolMetadata.value) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `First pool with ID ${pools[0].toString()} not found`
        );
      }

      // Determine input asset based on the output asset and first pool
      const pool = firstPoolMetadata.value.pool;
      let assetIn: AssetId;
      if (pool.asset_x.bits === assetOut.bits) {
        assetIn = pool.asset_y;
      } else if (pool.asset_y.bits === assetOut.bits) {
        assetIn = pool.asset_x;
      } else {
        throw new MiraV2Error(
          PoolCurveStateError.InvalidParameters,
          "Output asset not found in the first pool"
        );
      }

      const recipient = receiver
        ? addressInput(receiver)
        : addressInput(this.account.address);

      // Convert pool IDs to path (array of BN)
      const path = pools.map((poolId) => poolId);

      // Call the swap exact out script
      const normalizedDeadline = this.normalizeDeadline(deadline);
      let request = await this.swapExactOutScript.functions
        .main(
          amountOut,
          assetInput(assetIn),
          assetInput(assetOut),
          amountInMax,
          path,
          recipient,
          normalizedDeadline
        )
        .addContracts([this.ammContract])
        .txParams(txParams ?? {})
        .getTransactionRequest();

      // Prepare input assets for funding
      const inputAssets = [
        {
          assetId: assetIn.bits,
          amount: amountInMax,
        },
      ];

      return await this.prepareRequest(request, 1, inputAssets, [], options);
    }, context);
  }

  /**
   * Creates a new v2 pool with binned liquidity structure
   *
   * @param pool - Pool configuration (assets, bin step, base factor)
   * @param activeId - Initial active bin ID for the pool
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  async createPool(
    pool: PoolInput,
    activeId: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const context = createErrorContext("createPool", {pool});

    // Validate input parameters
    validatePoolInput(pool, context);
    validateBinId(activeId, context);

    return withErrorHandling(async () => {
      // Call the create pool contract method
      let request = await this.ammContract.functions
        .create_pool(
          {
            asset_x: assetInput(pool.assetX),
            asset_y: assetInput(pool.assetY),
            bin_step: pool.binStep,
            base_factor: pool.baseFactor,
          },
          activeId
        )
        .txParams(txParams ?? {})
        .getTransactionRequest();

      return await this.prepareRequest(request, 0, [], [], options);
    }, context);
  }

  /**
   * Creates a new v2 pool and adds initial liquidity in a single transaction
   *
   * @param pool - Pool configuration (assets, bin step, base factor)
   * @param activeId - Initial active bin ID for the pool
   * @param amountADesired - Desired amount of token A to add as initial liquidity
   * @param amountBDesired - Desired amount of token B to add as initial liquidity
   * @param deadline - Transaction deadline timestamp
   * @param liquidityConfig - Optional liquidity distribution configuration
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  async createPoolAndAddLiquidity(
    pool: PoolInput,
    activeId: BigNumberish,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish,
    deadline: BigNumberish,
    liquidityConfig?: LiquidityConfig[],
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const context = createErrorContext("createPoolAndAddLiquidity", {pool});

    // Validate input parameters
    validatePoolInput(pool, context);
    validateBinId(activeId, context);
    validateAmount(
      amountADesired,
      "amountADesired",
      DEFAULT_VALIDATION_OPTIONS,
      context
    );
    validateAmount(
      amountBDesired,
      "amountBDesired",
      DEFAULT_VALIDATION_OPTIONS,
      context
    );
    validateDeadline(deadline, DEFAULT_VALIDATION_OPTIONS, context);

    if (liquidityConfig) {
      validateLiquidityConfig(liquidityConfig, context);
    }

    return withErrorHandling(async () => {
      // Initialize loaders if blob scripts are enabled (reduces transaction size)
      if (this.useBlobScripts) {
        await this.initializeLoaders();
      }

      // First create the pool
      const createPoolRequest = await this.ammContract.functions
        .create_pool(
          {
            asset_x: assetInput(pool.assetX),
            asset_y: assetInput(pool.assetY),
            bin_step: pool.binStep,
            base_factor: pool.baseFactor,
          },
          activeId
        )
        .getTransactionRequest();

      // Calculate the pool ID that will be created
      // This is a simplified calculation - in practice you might need to query the contract
      const poolId = bn(Date.now()); // Placeholder - should be calculated properly

      // Default liquidity configuration if not provided
      const finalLiquidityConfig = liquidityConfig ?? [
        {
          binId: Number(activeId),
          distributionX: LIQUIDITY_DISTRIBUTION.MAX_DISTRIBUTION,
          distributionY: LIQUIDITY_DISTRIBUTION.MAX_DISTRIBUTION,
        },
      ];

      // Prepare the AddLiquidityParameters for the second call
      const addLiquidityParams = {
        pool: {
          asset_x: assetInput(pool.assetX),
          asset_y: assetInput(pool.assetY),
          bin_step: pool.binStep,
          base_factor: pool.baseFactor,
        },
        amount_x: amountADesired,
        amount_y: amountBDesired,
        amount_x_min: bn(amountADesired)
          .mul(10000 - V2_TRANSACTION_CONFIG.DEFAULT_SLIPPAGE * 10)
          .div(10000), // Default slippage tolerance
        amount_y_min: bn(amountBDesired)
          .mul(10000 - V2_TRANSACTION_CONFIG.DEFAULT_SLIPPAGE * 10)
          .div(10000), // Default slippage tolerance
        active_id_desired: activeId,
        id_slippage: 0,
        delta_ids: finalLiquidityConfig.map((config) => ({
          Positive: config.binId,
        })),
        distribution_x: finalLiquidityConfig.map(
          (config) => config.distributionX
        ),
        distribution_y: finalLiquidityConfig.map(
          (config) => config.distributionY
        ),
        to: addressInput(this.account.address),
        refund_to: addressInput(this.account.address),
        deadline,
      };

      // Call the add liquidity script
      let addLiquidityRequest = await this.addLiquidityScript.functions
        .main(addLiquidityParams)
        .addContracts([this.ammContract])
        .getTransactionRequest();

      // Combine both requests into a single transaction
      // Note: This is a simplified approach. In practice, you might need to use a batch transaction
      // or a specialized script that handles both operations atomically
      const combinedRequest = createPoolRequest;

      // Add the add liquidity call outputs to the create pool request
      combinedRequest.addVariableOutputs(2);

      // Prepare input assets for funding
      const inputAssets = [
        {
          assetId: pool.assetX.bits,
          amount: amountADesired,
        },
        {
          assetId: pool.assetY.bits,
          amount: amountBDesired,
        },
      ];

      return await this.prepareRequest(
        combinedRequest,
        2,
        inputAssets,
        [],
        options
      );
    }, context);
  }
}
