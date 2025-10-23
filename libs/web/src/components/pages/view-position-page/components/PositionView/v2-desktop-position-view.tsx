import React, {useState} from "react";
import Link from "next/link";
import {Button, ButtonGroup} from "@/meshwave-ui/Button";
import {PoolId} from "mira-dex-ts";

import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PromoBlock from "@/src/components/pages/liquidity-page/components/PromoBlock/PromoBlock";

import {ReserveItem} from "./reserve-item";
import {ExchangeRate} from "./exchange-rate";
import {MiraBlock} from "./mira-block";
import {PromoSparkle} from "@/meshwave-ui/src/components/icons";
import {DepositAmount} from "./deposit-amount";
import {useAssetPriceFromIndexer} from "@/src/hooks";
import SimulatedDistribution from "../../../bin-liquidity/components/simulated-distribution";
import {PoolType} from "@/src/components/common/PoolTypeIndicator";

import {getPoolNavigationUrl} from "@/src/utils/poolNavigation";
import {TotalDeposit} from "./total-deposit";

export interface AssetData {
  amount: string;
  metadata: {
    name?: string;
    symbol?: string;
    decimals?: number;
  } & {isLoading: boolean};
  reserve?: number;
}

export interface FeeData {
  amount: string;
  metadata: {
    name?: string;
    symbol?: string;
    decimals?: number;
  } & {isLoading: boolean};
}

export interface PositionStats {
  numBins: number;
  minPrice: number;
  maxPrice: number;
  liquidityShape: "spot" | "curve" | "bidask";
}

const TimeData = ["24H", "7D", "30D"];

export function V2DesktopPositionView({
  pool,
  isStablePool,
  poolType,
  formattedTvlValue,
  positionPath,
  nftAssetId,
  binStep,
  assetA,
  assetB,
  feesA,
  feesB,
  binPositions,
  positionStats,
}: {
  pool: PoolId;
  isStablePool: boolean;
  poolType?: PoolType;
  formattedTvlValue: string;
  positionPath: string;
  nftAssetId?: string;
  binStep?: number;
  assetA: AssetData;
  assetB: AssetData;
  feesA?: FeeData;
  feesB?: FeeData;
  binPositions?: any[];
  positionStats?: PositionStats;
}) {
  const renderRemoveLiquidity = () => {
    const removePath = getPoolNavigationUrl(pool, "remove");

    return (
      <Link href={removePath}>
        <Button variant="outline">Remove Liquidity</Button>
      </Link>
    );
  };

  // Get asset prices from indexer
  const {price: asset0PriceUSD} = useAssetPriceFromIndexer(pool[0].bits);
  const {price: asset1PriceUSD} = useAssetPriceFromIndexer(pool[1].bits);

  // Calculate current price from position stats (middle of range as approximation)
  const currentPrice = positionStats
    ? (positionStats.minPrice + positionStats.maxPrice) / 2
    : 0;

  // Parse amounts for distribution chart
  const totalAsset0Amount = parseFloat(assetA.amount) || 0;
  const totalAsset1Amount = parseFloat(assetB.amount) || 0;

  const [selectedTime, setSelectedtime] = useState(TimeData[1]);

  const handleButtonClick = (value: string) => {
    setSelectedtime(value);
  };

  return (
    <section className="flex flex-col gap-3 desktopOnly">
      <div className="flex justify-between items-center">
        <div className="flex items-start justify-between gap-2">
          <CoinPair
            firstCoin={pool[0].bits}
            secondCoin={pool[1].bits}
            isStablePool={isStablePool}
            poolType={poolType ?? (isStablePool ? "v1-stable" : "v1-volatile")}
            withPoolDetails
          />
        </div>
        <div className="flex items-center gap-2.5">
          {renderRemoveLiquidity()}

          <Link href={positionPath}>
            <Button>Add Liquidity</Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <MiraBlock pool={pool} isV2={true} nftAssetId={nftAssetId} />
        <div className="p-4 w-1/2 rounded-lg flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[11px]">
          <p className="text-base leading-[19px] border-b border-background-grey-light pb-3">
            Pool reserves
          </p>
          <ReserveItem
            assetId={pool[0].bits}
            amount={assetA.amount}
            reserve={assetA.reserve}
          />
          <ReserveItem
            assetId={pool[1].bits}
            amount={assetB.amount}
            reserve={assetB.reserve}
          />

          <div className="flex flex-col gap-1 border-t border-background-grey-light pt-3">
            <div className="flex items-center justify-between text-content-tertiary">
              {formattedTvlValue && (
                <p className="text-sm">Total value locked</p>
              )}
              {formattedTvlValue && (
                <p className="text-sm">${formattedTvlValue}</p>
              )}
            </div>
            <ExchangeRate
              assetBMetadata={assetB.metadata}
              assetAMetadata={assetA.metadata}
              coinAAmount={assetA.amount}
              coinBAmount={assetB.amount}
            />
          </div>
        </div>
      </div>

      <div className="w-full p-4 rounded-xl flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[12px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col gap-1">
            <div className="text-content-primary text-base leading-[19px]">
              Your liquidity
            </div>
            {positionStats && (
              <div className="text-content-tertiary text-sm">
                {positionStats.numBins} bin
                {positionStats.numBins !== 1 ? "s" : ""} • Range: $
                {positionStats.minPrice.toFixed(4)} - $
                {positionStats.maxPrice.toFixed(4)}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#F95465] rounded-full mr-2"></div>
              <span className="text-sm text-content-primary">
                {assetA.metadata.symbol}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#72A2FF] rounded-full mr-2"></div>
              <span className="text-sm text-content-primary">
                {assetB.metadata.symbol}
              </span>
            </div>
          </div>
        </div>

        {positionStats &&
          totalAsset0Amount > 0 &&
          totalAsset1Amount > 0 &&
          binStep && (
            <div className="border-b border-background-grey-light">
              <SimulatedDistribution
                liquidityShape={positionStats.liquidityShape}
                minPrice={positionStats.minPrice}
                maxPrice={positionStats.maxPrice}
                currentPrice={currentPrice}
                binStepBasisPoints={binStep}
                asset0Symbol={assetA.metadata.symbol || "Token A"}
                asset1Symbol={assetB.metadata.symbol || "Token B"}
                asset0Price={asset0PriceUSD || 0}
                asset1Price={asset1PriceUSD || 0}
                totalAsset0Amount={totalAsset0Amount}
                totalAsset1Amount={totalAsset1Amount}
              />
            </div>
          )}

        <DepositAmount assetId={pool[0].bits} amount={assetA.amount} />
        <DepositAmount assetId={pool[1].bits} amount={assetB.amount} />
        {formattedTvlValue && (
          <div className="w-full h-0.5 bg-content-grey-dark dark:bg-white opacity-10" />
        )}

        <TotalDeposit
          assetAId={pool[0].bits}
          assetAmount={assetA.amount}
          assetBId={pool[1].bits}
          assetBmount={assetB.amount}
        />
      </div>

      {feesA && feesB && (
        <div className="w-full p-4 rounded-xl flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[12px]">
          <div className="flex justify-between items-center mb-4 border-b border-background-grey-light pb-4">
            <div className="flex flex-col">
              <div className="text-content-primary text-base leading-[19px]">
                Fees earned
              </div>
              <div className="text-content-tertiary text-sm">
                Cumulative fees from all bins
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ButtonGroup
                items={TimeData}
                value={selectedTime}
                onChange={handleButtonClick}
              />
            </div>
          </div>

          <DepositAmount assetId={pool[0].bits} amount={feesA.amount} />
          <DepositAmount assetId={pool[1].bits} amount={feesB.amount} />
          {formattedTvlValue && (
            <div className="w-full h-0.5 bg-content-grey-dark dark:bg-white opacity-10" />
          )}

          <TotalDeposit
            title="Total fees earned:"
            assetAId={pool[0].bits}
            assetAmount={feesA.amount}
            assetBId={pool[1].bits}
            assetBmount={feesB.amount}
          />
        </div>
      )}

      <PromoBlock
        icon={<PromoSparkle />}
        title="Learn about providing liquidity"
        link="https://mirror.xyz/miraly.eth"
        linkText="Click here and check our v3 LP walkthrough"
        background="black"
      />
    </section>
  );
}
