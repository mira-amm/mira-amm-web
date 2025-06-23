import { AssetId, BigNumberish, BN, Provider } from "fuels";
import { DEFAULT_AMM_CONTRACT_ID } from "./constants";
import { MiraAmmContract } from "./typegen/MiraAmmContract";
import { AmmFees, AmmMetadata, Asset, LpAssetInfo, PoolId, PoolMetadata } from "./model";
import { arrangePoolParams, assetInput, poolContainsAsset, poolIdInput, reorderPoolId } from "./utils";
import { addFee, BASIS_POINTS, getAmountIn, getAmountOut, powDecimals, subtractFee } from "./math";

const DECIMALS_PRECISION = 1000000000000

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
      owner: await this.owner()
    }
  }

  async poolMetadataBatch(poolIds: PoolId[]): Promise<(PoolMetadata | null)[]> {
    const poolIdTransactions = poolIds
      .map(poolId => (
        this.ammContract
          .functions.pool_metadata(poolIdInput(poolId))
      ))

    const results = await this.ammContract
      .multiCall(poolIdTransactions)
      .get();

    return poolIds.map((poolId, index) => {
      const value = results.value[index]
      return {
        poolId: poolId,
        reserve0: value.reserve_0,
        reserve1: value.reserve_1,
        liquidity: [value.liquidity.id, value.liquidity.amount],
        decimals0: value.decimals_0,
        decimals1: value.decimals_1,
      }
    })
  }

  async poolMetadata(poolId: PoolId): Promise<PoolMetadata | null> {
    poolId = reorderPoolId(poolId);
    const result = await this.ammContract.functions.pool_metadata(poolIdInput(poolId)).get();
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
    const [lpFeeVolatile, lpFeeStable, protocolFeeVolatile, protocolFeeStable] = result.value;
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
    const name = await this.ammContract.functions.name(assetInput(assetId)).get();
    const symbol = await this.ammContract.functions.symbol(assetInput(assetId)).get();
    const decimals = await this.ammContract.functions.decimals(assetInput(assetId)).get();
    const totalSupply = await this.ammContract.functions.total_supply(assetInput(assetId)).get();

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
    return (await this.ammContract.functions.total_supply(assetInput(assetId)).get()).value;
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
    isFirstToken: boolean,
  ): Promise<Asset> {
    poolId = reorderPoolId(poolId);
    const pool = await this.poolMetadata(poolId);
    if (!pool) {
      throw new Error('Pool not found');
    }
    if (pool.reserve0.isZero() || pool.reserve1.isZero()) {
      throw new Error('Reserve is zero. Any number of tokens can be added');
    }
    if (isFirstToken) {
      const otherTokenAmount = new BN(amount).mul(pool.reserve1).div(pool.reserve0).add(new BN(1));
      return [pool.poolId[1], otherTokenAmount];
    } else {
      const otherTokenAmount = new BN(amount).mul(pool.reserve0).div(pool.reserve1).add(new BN(1));
      return [pool.poolId[0], otherTokenAmount];
    }
  }

  async getLiquidityPosition(poolId: PoolId, lpTokensAmount: BigNumberish): Promise<[Asset, Asset]> {
    poolId = reorderPoolId(poolId);
    const lpTokensBN = new BN(lpTokensAmount);
    if (lpTokensBN.isNeg() || lpTokensBN.isZero()) {
      throw new Error('Non positive input amount');
    }
    const pool = await this.poolMetadata(poolId);
    if (!pool) {
      throw new Error('Pool not found');
    }
    if (lpTokensBN.gt(pool.liquidity[1])) {
      throw new Error('Not enough liquidity');
    }

    const amount0 = pool.reserve0.mul(lpTokensBN).div(pool.liquidity[1]);
    const amount1 = pool.reserve1.mul(lpTokensBN).div(pool.liquidity[1]);
    return [[pool.poolId[0], amount0], [pool.poolId[1], amount1]];
  }

  async getAmountsOut(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    pools: PoolId[]
  ): Promise<Asset[]> {
    const assetAmount = new BN(assetAmountIn);
    if (assetAmount.isNeg() || assetAmount.isZero()) {
      throw new Error('Non positive input amount');
    }

    const fees = await this.fees();

    const reorderedPoolIds = pools.map(reorderPoolId);

    const poolMetadataList = await this.poolMetadataBatch(reorderedPoolIds);

    poolMetadataList.forEach((pool) => {
      if (!pool) {
        throw new Error('Pool not found');
      }
    });

    const initialState = {
      assetIn: assetIdIn,
      amountIn: assetAmount,
      amountsOut: [[assetIdIn, assetAmount]] as Asset[],
    };

    const result = reorderedPoolIds.reduce((state, poolId, i) => {
      const pool = poolMetadataList[i]!;

      const amountInAfterFee = subtractFee(poolId, state.amountIn, fees);

      const [assetOut, reserveIn, reserveOut, decimalsIn, decimalsOut] =
        arrangePoolParams(pool, state.assetIn);

      const amountOut = getAmountOut(
        poolId[2],
        reserveIn,
        reserveOut,
        powDecimals(decimalsIn),
        powDecimals(decimalsOut),
        amountInAfterFee
      );

      state.assetIn = assetOut;
      state.amountIn = amountOut;
      state.amountsOut.push([assetOut, amountOut]);

      return state;
    }, initialState);

    return result.amountsOut;
  }

  async getAmountsIn(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    pools: PoolId[]
  ): Promise<Asset[]> {
    const assetAmount = new BN(assetAmountOut);
    if (assetAmount.isNeg() || assetAmount.isZero()) {
      throw new Error('Non positive input amount');
    }

    const feesPromise = this.fees();

    const reversedPools = [...pools].reverse();
    const reorderedPoolIds = reversedPools.map(reorderPoolId);

    const poolMetadataList = await this.poolMetadataBatch(reorderedPoolIds);

    poolMetadataList.forEach((pool) => {
      if (!pool) {
        throw new Error('Pool not found');
      }
    });

    const initialState = {
      assetOut: assetIdOut,
      amountOut: assetAmount,
      amountsIn: [[assetIdOut, assetAmount]] as Asset[],
    };

    const fees = await feesPromise;
    const result = reorderedPoolIds.reduce((state, poolId, i) => {
      const pool = poolMetadataList[i]!;
      const [assetIn, reserveOut, reserveIn, decimalsOut, decimalsIn] =
        arrangePoolParams(pool, state.assetOut);

      let amountIn = getAmountIn(
        poolId[2],
        reserveIn,
        reserveOut,
        powDecimals(decimalsIn),
        powDecimals(decimalsOut),
        state.amountOut
      );

      amountIn = addFee(poolId, amountIn, fees);

      state.assetOut = assetIn;
      state.amountOut = amountIn;
      state.amountsIn.push([assetIn, amountIn]);

      return state;
    }, initialState);

    return result.amountsIn;
  }

  async previewSwapExactInput(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    pools: PoolId[]
  ): Promise<Asset> {
    const amountsOut = await this.getAmountsOut(assetIdIn, assetAmountIn, pools);
    return amountsOut[amountsOut.length - 1];
  }

  async previewSwapExactOutput(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    pools: PoolId[]
  ): Promise<Asset> {
    const amountsIn = await this.getAmountsIn(assetIdOut, assetAmountOut, pools);
    return amountsIn[amountsIn.length - 1];
  }

  async previewSwapExactInputBatch(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    routes: PoolId[][]
  ): Promise<Asset[]> {
    const amountsOut = await Promise.all(routes.map(route => this.getAmountsIn(assetIdIn, assetAmountIn, route)));
    return amountsOut.map(amounts => amounts[amounts.length - 1]);
  }

  async previewSwapExactOutputBatch(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    routes: PoolId[][]
  ): Promise<Asset[]> {
    const amountsIn = await Promise.all(routes.map(route => this.getAmountsOut(assetIdOut, assetAmountOut, route)));
    return amountsIn.map(amounts => amounts[amounts.length - 1]);
  }

  async getCurrentRate(
    assetId: AssetId,
    pools: PoolId[]
  ): Promise<[number, number?, number?]> {
    if (pools.length === 0) {
      throw new Error('No pools provided');
    }
    let lastPool = pools[pools.length - 1];
    if (!poolContainsAsset(lastPool, assetId)) {
      pools = pools.slice().reverse();
      lastPool = pools[pools.length - 1];
      if (!poolContainsAsset(lastPool, assetId)) {
        throw new Error('Asset not found in border pools');
      }
    }

    let assetIdIn = assetId;
    for (let poolId of pools.slice().reverse()) {
      if (poolId[0].bits === assetIdIn.bits) {
        assetIdIn = poolId[1];
      } else if (poolId[1].bits === assetIdIn.bits) {
        assetIdIn = poolId[0];
      } else {
        throw new Error('Incorrect pools');
      }
    }

    let currentRate = new BN(DECIMALS_PRECISION);
    let assetIn = assetIdIn;
    let assetDecimalsIn, assetDecimalsOut;
    const fees = await this.fees();
    const volatileFee = fees.lpFeeVolatile.toNumber() + fees.protocolFeeVolatile.toNumber();
    for (const poolId of pools) {
      const pool = await this.poolMetadata(poolId);
      if (!pool) {
        throw new Error(`Pool not found ${poolId}`);
      }
      const [reserveIn, reserveOut, assetOut, decimalsIn, decimalsOut] = poolId[0].bits === assetIn.bits ?
        [pool.reserve0, pool.reserve1, poolId[1], pool.decimals0, pool.decimals1] :
        [pool.reserve1, pool.reserve0, poolId[0], pool.decimals1, pool.decimals0];
      if (assetIdIn.bits === assetIn.bits) {
        assetDecimalsIn = decimalsIn;
      }
      if (poolId[2]) {
        // stable
        // TODO: temporary & fast solution based on the attempt to swap 100 tokens
        const assetAmountIn = 100;
        // already accounts for fees
        const amountsOut = await this.getAmountsOut(assetIn, assetAmountIn, [poolId]);
        const assetOut = amountsOut[amountsOut.length - 1][1];
        currentRate = currentRate.mul(assetAmountIn).div(assetOut);
      } else {
        // volatile
        currentRate = currentRate.mul(reserveIn).div(reserveOut).mul(BASIS_POINTS.sub(volatileFee)).div(BASIS_POINTS);
      }
      assetIn = assetOut;
      assetDecimalsOut = decimalsOut;
    }
    let rate = currentRate.toNumber() / DECIMALS_PRECISION
    return [rate, assetDecimalsIn, assetDecimalsOut];
  }
}
