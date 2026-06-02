"use client";

import {useEffect, useMemo, useState} from "react";
import {useIsConnected} from "@fuels/react";
import {bn, BN} from "fuels";

import {useCheckActiveNetwork} from "@/src/hooks/useCheckActiveNetwork";
import {useKnownAssetLiquidityPositions} from "@/src/hooks/useKnownAssetLiquidityPositions";
import {useRemoveLiquidity} from "@/src/hooks/useRemoveLiquidity";
import type {KnownAssetLiquidityPosition} from "@/src/hooks/useKnownAssetLiquidityPositions";
import {DefaultLocale, FuelAppUrl} from "@/src/utils/constants";

function formatAmount(amount: BN, decimals: number) {
  return amount.formatUnits(decimals).toLocaleString();
}

function shortId(id: string) {
  return `${id.slice(0, 10)}...${id.slice(-8)}`;
}

function poolLabel(position: KnownAssetLiquidityPosition) {
  return `${position.assetA.symbol}/${position.assetB.symbol} ${
    position.isStable ? "stable" : "volatile"
  }`;
}

function RemovePositionPanel({
  position,
  onRemoved,
}: {
  position: KnownAssetLiquidityPosition;
  onRemoved: () => Promise<unknown>;
}) {
  const [percentage, setPercentage] = useState(100);
  const [slippagePercent, setSlippagePercent] = useState(1);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [localError, setLocalError] = useState<Error | null>(null);
  const isValidNetwork = useCheckActiveNetwork();

  const [asset0, asset1] = position.underlyingAssets;
  const asset0Info =
    asset0[0].bits === position.assetA.assetId
      ? position.assetA
      : position.assetB;
  const asset1Info =
    asset1[0].bits === position.assetA.assetId
      ? position.assetA
      : position.assetB;

  const coinAAmountToWithdraw = asset0[1].mul(bn(percentage)).div(bn(100));
  const coinBAmountToWithdraw = asset1[1].mul(bn(percentage)).div(bn(100));
  const slippageBps = Math.max(0, Math.round(slippagePercent * 100));
  const minMultiplier = Math.max(0, 10_000 - slippageBps);
  const minCoinAAmount = coinAAmountToWithdraw
    .mul(bn(minMultiplier))
    .div(bn(10_000));
  const minCoinBAmount = coinBAmountToWithdraw
    .mul(bn(minMultiplier))
    .div(bn(10_000));

  const {removeLiquidity, isPending} = useRemoveLiquidity({
    pool: position.poolId,
    liquidityPercentage: percentage,
    lpTokenBalance: position.lpTokenBalance,
    coinAAmountToWithdraw,
    coinBAmountToWithdraw,
    slippageBps,
  });

  async function handleRemoveLiquidity() {
    setLocalError(null);
    setTransactionHash(null);

    try {
      const tx = await removeLiquidity();
      if (tx?.id) {
        setTransactionHash(tx.id);
      }
      await onRemoved();
    } catch (error) {
      setLocalError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  const removeDisabled =
    isPending || !isValidNetwork || percentage <= 0 || percentage > 100;

  return (
    <section className="flex flex-col gap-4 rounded border border-border-secondary p-4">
      <div>
        <h2 className="text-xl leading-6">{poolLabel(position)}</h2>
        <p className="text-sm text-content-tertiary">
          LP asset: {shortId(position.lpAssetId)}
        </p>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <p className="text-content-tertiary">LP balance</p>
          <p>{formatAmount(position.lpTokenBalance, 9)}</p>
        </div>
        <div>
          <p className="text-content-tertiary">Pool id</p>
          <p>
            {shortId(position.poolId[0].bits)} /{" "}
            {shortId(position.poolId[1].bits)} /{" "}
            {position.poolId[2] ? "stable" : "volatile"}
          </p>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Remove percentage
        <input
          className="rounded border border-border-secondary bg-transparent p-2"
          type="number"
          min={0}
          max={100}
          value={percentage}
          onChange={(event) => setPercentage(Number(event.target.value))}
        />
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={percentage}
        onChange={(event) => setPercentage(Number(event.target.value))}
      />

      <label className="flex flex-col gap-1 text-sm">
        Slippage percent
        <input
          className="rounded border border-border-secondary bg-transparent p-2"
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={slippagePercent}
          onChange={(event) => setSlippagePercent(Number(event.target.value))}
        />
      </label>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded border border-border-secondary p-3">
          <p className="text-content-tertiary">Expected out</p>
          <p>
            {formatAmount(coinAAmountToWithdraw, asset0Info.decimals)}{" "}
            {asset0Info.symbol}
          </p>
          <p>
            {formatAmount(coinBAmountToWithdraw, asset1Info.decimals)}{" "}
            {asset1Info.symbol}
          </p>
        </div>
        <div className="rounded border border-border-secondary p-3">
          <p className="text-content-tertiary">Minimum out</p>
          <p>
            {formatAmount(minCoinAAmount, asset0Info.decimals)}{" "}
            {asset0Info.symbol}
          </p>
          <p>
            {formatAmount(minCoinBAmount, asset1Info.decimals)}{" "}
            {asset1Info.symbol}
          </p>
        </div>
      </div>

      {!isValidNetwork && (
        <p className="text-sm text-accent-alert">
          Wallet is on the wrong network.
        </p>
      )}
      {localError && (
        <p className="break-words text-sm text-accent-alert">
          {localError.message}
        </p>
      )}
      {transactionHash && (
        <a
          className="text-sm underline"
          href={`${FuelAppUrl}/tx/${transactionHash}/simple`}
          rel="noreferrer"
          target="_blank"
        >
          View transaction {shortId(transactionHash)}
        </a>
      )}

      <button
        className="rounded bg-content-primary px-4 py-3 text-background-primary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={removeDisabled}
        onClick={handleRemoveLiquidity}
      >
        {isPending ? "Removing..." : "Remove liquidity"}
      </button>
    </section>
  );
}

export default function BasicRemoveLiquidityPage() {
  const {isConnected} = useIsConnected();
  const {
    data: positions,
    isLoading,
    candidateCount,
    refetch,
    refetchBalances,
  } = useKnownAssetLiquidityPositions();
  const [selectedLpAssetId, setSelectedLpAssetId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!selectedLpAssetId && positions?.[0]) {
      setSelectedLpAssetId(positions[0].lpAssetId);
    }
  }, [positions, selectedLpAssetId]);

  const selectedPosition = useMemo(
    () =>
      positions?.find((position) => position.lpAssetId === selectedLpAssetId) ??
      positions?.[0],
    [positions, selectedLpAssetId]
  );

  async function refreshPositions() {
    await refetchBalances();
    await refetch();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl leading-8">Basic liquidity removal</h1>
        <p className="text-sm text-content-tertiary">
          Scans {candidateCount.toLocaleString(DefaultLocale)} known-asset pool
          candidates locally. No indexer requests are used by this page.
        </p>
      </div>

      {!isConnected && (
        <p className="rounded border border-border-secondary p-4">
          Connect a wallet to scan for LP balances.
        </p>
      )}

      {isConnected && isLoading && (
        <p className="rounded border border-border-secondary p-4">
          Scanning known LP assets...
        </p>
      )}

      {isConnected && !isLoading && positions?.length === 0 && (
        <p className="rounded border border-border-secondary p-4">
          No known-asset LP balances found in this wallet.
        </p>
      )}

      {positions && positions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg leading-6">Detected positions</h2>
          <div className="flex flex-col gap-2">
            {positions.map((position) => (
              <button
                className="rounded border border-border-secondary p-3 text-left disabled:opacity-70"
                disabled={position.lpAssetId === selectedPosition?.lpAssetId}
                key={position.lpAssetId}
                onClick={() => setSelectedLpAssetId(position.lpAssetId)}
              >
                <span className="block">{poolLabel(position)}</span>
                <span className="block text-sm text-content-tertiary">
                  LP {formatAmount(position.lpTokenBalance, 9)} |{" "}
                  {shortId(position.lpAssetId)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedPosition && (
        <RemovePositionPanel
          key={selectedPosition.lpAssetId}
          position={selectedPosition}
          onRemoved={refreshPositions}
        />
      )}
    </main>
  );
}
