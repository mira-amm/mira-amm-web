import {AssetId, BigNumberish, BN, Provider} from "fuels";
import {DEFAULT_AMM_CONTRACT_ID} from "./constants";
import {MiraAmmContract} from "./typegen/MiraAmmContract";
import {
  AmmFees,
  AmmMetadata,
  Asset,
  LpAssetInfo,
  PoolId,
  PoolMetadata,
} from "./model";
import {
  arrangePoolParams,
  assetInput,
  poolContainsAsset,
  poolIdInput,
  reorderPoolId,
} from "./utils";
import {
  addFee,
  BASIS_POINTS,
  getAmountIn,
  getAmountOut,
  powDecimals,
  subtractFee,
} from "./math";

const DECIMALS_PRECISION = 1000000000000;

export class ReadonlyMiraAmm {
  provider: Provider;
  ammContract: MiraAmmContract;

  constructor(provider: Provider, contractIdOpt?: string) {
    let contractId = contractIdOpt ?? DEFAULT_AMM_CONTRACT_ID;
    this.provider = provider;
    this.ammContract = new MiraAmmContract(contractId, provider);
  }

  id(): string {
    return this.ammContract.id.toString();
  }

  async ammMetadata(): Promise<AmmMetadata> {
    return {
      id: this.id(),
      fees: await this.fees(),
      hook: await this.hook(),
      totalAssets: await this.totalAssets(),
      owner: await this.owner(),
    };
  }

  async poolMetadataBatch(poolIds: PoolId[]): Promise<(PoolMetadata | null)[]> {
    const poolIdTransactions = poolIds.map((poolId) =>
      this.ammContract.functions.pool_metadata(poolIdInput(poolId))
    );

    const {value} = await this.ammContract.multiCall(poolIdTransactions).get();

    if (!value || value.length !== poolIds.length) {
      throw new Error(
        "Mismatch between pools and metadata results while fetching pool metadata in batch."
      );
    }

    return poolIds.map((poolId, index) => {
      const pool = value[index];
      return {
        poolId: poolId,
        reserve0: pool.reserve_0,
        reserve1: pool.reserve_1,
        liquidity: [pool.liquidity.id, pool.liquidity.amount],
        decimals0: pool.decimals_0,
        decimals1: pool.decimals_1,
      };
    });
  }

  async poolMetadata(poolId: PoolId): Promise<PoolMetadata | null> {
    poolId = reorderPoolId(poolId);
    const result = await this.ammContract.functions
      .pool_metadata(poolIdInput(poolId))
      .get();
    const value = result.value;
    if (!value) {
      return null;
    }

    return {
      poolId: poolId,
      reserve0: value.reserve_0,
      reserve1: value.reserve_1,
      liquidity: [value.liquidity.id, value.liquidity.amount],
      decimals0: value.decimals_0,
      decimals1: value.decimals_1,
    };
  }

  async fees(): Promise<AmmFees> {
    // we're doing a 2nd set of calls
    const result = await this.ammContract.functions.fees().get();
    const [lpFeeVolatile, lpFeeStable, protocolFeeVolatile, protocolFeeStable] =
      result.value;
    return {
      lpFeeVolatile: lpFeeVolatile,
      lpFeeStable: lpFeeStable,
      protocolFeeVolatile: protocolFeeVolatile,
      protocolFeeStable: protocolFeeStable,
    };
  }

  async hook(): Promise<string | null> {
    const result = await this.ammContract.functions.hook().get();
    return result.value?.bits || null;
  }

  async totalAssets(): Promise<BN> {
    const result = await this.ammContract.functions.total_assets().get();
    return result.value;
  }

  async lpAssetInfo(assetId: AssetId): Promise<LpAssetInfo | null> {
    const name = await this.ammContract.functions
      .name(assetInput(assetId))
      .get();
    const symbol = await this.ammContract.functions
      .symbol(assetInput(assetId))
      .get();
    const decimals = await this.ammContract.functions
      .decimals(assetInput(assetId))
      .get();
    const totalSupply = await this.ammContract.functions
      .total_supply(assetInput(assetId))
      .get();

    if (name.value && symbol.value && decimals.value && totalSupply.value) {
      return {
        assetId: assetId,
        name: name.value,
        symbol: symbol.value,
        decimals: decimals.value,
        totalSupply: totalSupply.value,
      };
    } else {
      return null;
    }
  }

  async totalSupply(assetId: AssetId): Promise<BN | undefined> {
    return (
      await this.ammContract.functions.total_supply(assetInput(assetId)).get()
    ).value;
  }

  async owner(): Promise<string | null> {
    const result = await this.ammContract.functions.owner().get();
    const ownershipState = result.value;
    const identity = ownershipState.Initialized;
    const bits = identity?.Address?.bits ?? identity?.ContractId?.bits;
    return bits || null;
  }

  async getOtherTokenToAddLiquidity(
    poolId: PoolId,
    amount: BigNumberish,
    isFirstToken: boolean
  ): Promise<Asset> {
    poolId = reorderPoolId(poolId);
    const pool = await this.poolMetadata(poolId);
    if (!pool) {
      throw new Error("Pool not found");
    }
    if (pool.reserve0.isZero() || pool.reserve1.isZero()) {
      throw new Error("Reserve is zero. Any number of tokens can be added");
    }
    if (isFirstToken) {
      const otherTokenAmount = new BN(amount)
        .mul(pool.reserve1)
        .div(pool.reserve0)
        .add(new BN(1));
      return [pool.poolId[1], otherTokenAmount];
    } else {
      const otherTokenAmount = new BN(amount)
        .mul(pool.reserve0)
        .div(pool.reserve1)
        .add(new BN(1));
      return [pool.poolId[0], otherTokenAmount];
    }
  }

  async getLiquidityPosition(
    poolId: PoolId,
    lpTokensAmount: BigNumberish
  ): Promise<[Asset, Asset]> {
    poolId = reorderPoolId(poolId);
    const lpTokensBN = new BN(lpTokensAmount);
    if (lpTokensBN.isNeg() || lpTokensBN.isZero()) {
      throw new Error("Non positive input amount");
    }
    const pool = await this.poolMetadata(poolId);
    if (!pool) {
      throw new Error("Pool not found");
    }
    if (lpTokensBN.gt(pool.liquidity[1])) {
      throw new Error("Not enough liquidity");
    }

    const amount0 = pool.reserve0.mul(lpTokensBN).div(pool.liquidity[1]);
    const amount1 = pool.reserve1.mul(lpTokensBN).div(pool.liquidity[1]);
    return [
      [pool.poolId[0], amount0],
      [pool.poolId[1], amount1],
    ];
  }

  private async computeSwapPath(
    direction: "IN" | "OUT",
    assetId: AssetId,
    amount: BN,
    pools: PoolId[],
    fees: AmmFees
  ): Promise<Asset[]> {
    const orderedPools = direction === "IN" ? pools : [...pools].reverse();
    const poolMetadataList = await this.poolMetadataBatch(
      orderedPools.map(reorderPoolId)
    );

    let currentAsset = assetId;
    let currentAmount = amount;
    const result: Asset[] = [[currentAsset, currentAmount]];

    for (let i = 0; i < orderedPools.length; i++) {
      const pool = poolMetadataList[i]!;
      const poolId = orderedPools[i];

      const [assetOut, reserveIn, reserveOut, decimalsIn, decimalsOut] =
        arrangePoolParams(pool, currentAsset);

      let amount =
        direction === "IN"
          ? subtractFee(poolId, currentAmount, fees)
          : currentAmount;

      let swapAmount =
        direction === "IN"
          ? getAmountOut(
              poolId[2],
              reserveIn,
              reserveOut,
              powDecimals(decimalsIn),
              powDecimals(decimalsOut),
              amount
            )
          : getAmountIn(
              poolId[2],
              reserveIn,
              reserveOut,
              powDecimals(decimalsIn),
              powDecimals(decimalsOut),
              amount
            );

      if (direction === "OUT") {
        swapAmount = addFee(poolId, swapAmount, fees);
      }

      result.push([assetOut, swapAmount]);
      currentAsset = assetOut;
      currentAmount = swapAmount;
    }

    return result;
  }

  async getAmountsOut(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    pools: PoolId[]
  ) {
    const amount = new BN(assetAmountIn);
    if (amount.isNeg() || amount.isZero())
      throw new Error("Non positive input amount");
    const fees = await this.fees();
    return this.computeSwapPath("IN", assetIdIn, amount, pools, fees);
  }

  async getAmountsIn(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    pools: PoolId[]
  ) {
    const amount = new BN(assetAmountOut);
    if (amount.isNeg() || amount.isZero())
      throw new Error("Non positive input amount");
    const fees = await this.fees();
    return this.computeSwapPath("OUT", assetIdOut, amount, pools, fees);
  }

  async previewSwapExactInput(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    pools: PoolId[]
  ): Promise<Asset> {
    const amountsOut = await this.getAmountsOut(
      assetIdIn,
      assetAmountIn,
      pools
    );
    return amountsOut[amountsOut.length - 1];
  }

  async previewSwapExactOutput(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    pools: PoolId[]
  ): Promise<Asset> {
    const amountsIn = await this.getAmountsIn(
      assetIdOut,
      assetAmountOut,
      pools
    );
    return amountsIn[amountsIn.length - 1];
  }

  async previewSwapExactInputBatch(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    routes: PoolId[][]
  ): Promise<(Asset | undefined)[]> {
    const results = await Promise.allSettled(
      routes.map((route) => this.getAmountsOut(assetIdIn, assetAmountIn, route))
    );
    return results.map((r) =>
      r.status === "fulfilled" ? r.value[r.value.length - 1] : undefined
    );
  }

  async previewSwapExactOutputBatch(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    routes: PoolId[][]
  ): Promise<(Asset | undefined)[]> {
    const results = await Promise.allSettled(
      routes.map((route) =>
        this.getAmountsOut(assetIdOut, assetAmountOut, route)
      )
    );

    return results.map((r) =>
      r.status === "fulfilled" ? r.value[r.value.length - 1] : undefined
    );
  }

  async getCurrentRate(
    assetId: AssetId,
    pools: PoolId[]
  ): Promise<[number, number?, number?]> {
    if (pools.length === 0) {
      throw new Error("No pools provided");
    }
    let lastPool = pools[pools.length - 1];
    if (!poolContainsAsset(lastPool, assetId)) {
      pools = pools.slice().reverse();
      lastPool = pools[pools.length - 1];
      if (!poolContainsAsset(lastPool, assetId)) {
        throw new Error("Asset not found in border pools");
      }
    }

    let assetIdIn = assetId;
    for (let poolId of pools.slice().reverse()) {
      if (poolId[0].bits === assetIdIn.bits) {
        assetIdIn = poolId[1];
      } else if (poolId[1].bits === assetIdIn.bits) {
        assetIdIn = poolId[0];
      } else {
        throw new Error("Incorrect pools");
      }
    }

    let currentRate = new BN(DECIMALS_PRECISION);
    let assetIn = assetIdIn;
    let assetDecimalsIn, assetDecimalsOut;
    const fees = await this.fees();
    const volatileFee =
      fees.lpFeeVolatile.toNumber() + fees.protocolFeeVolatile.toNumber();
    for (const poolId of pools) {
      const pool = await this.poolMetadata(poolId);
      if (!pool) {
        throw new Error(`Pool not found ${poolId}`);
      }
      const [reserveIn, reserveOut, assetOut, decimalsIn, decimalsOut] =
        poolId[0].bits === assetIn.bits
          ? [
              pool.reserve0,
              pool.reserve1,
              poolId[1],
              pool.decimals0,
              pool.decimals1,
            ]
          : [
              pool.reserve1,
              pool.reserve0,
              poolId[0],
              pool.decimals1,
              pool.decimals0,
            ];
      if (assetIdIn.bits === assetIn.bits) {
        assetDecimalsIn = decimalsIn;
      }
      if (poolId[2]) {
        // stable
        // TODO: temporary & fast solution based on the attempt to swap 100 tokens
        const assetAmountIn = 100;
        // already accounts for fees
        const amountsOut = await this.getAmountsOut(assetIn, assetAmountIn, [
          poolId,
        ]);
        const assetOut = amountsOut[amountsOut.length - 1][1];
        currentRate = currentRate.mul(assetAmountIn).div(assetOut);
      } else {
        // volatile
        currentRate = currentRate
          .mul(reserveIn)
          .div(reserveOut)
          .mul(BASIS_POINTS.sub(volatileFee))
          .div(BASIS_POINTS);
      }
      assetIn = assetOut;
      assetDecimalsOut = decimalsOut;
    }
    let rate = currentRate.toNumber() / DECIMALS_PRECISION;
    return [rate, assetDecimalsIn, assetDecimalsOut];
  }
}
