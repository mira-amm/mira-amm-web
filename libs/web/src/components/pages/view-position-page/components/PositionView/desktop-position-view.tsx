import React from "react";
import Link from "next/link";
import {Button} from "@/meshwave-ui/Button";
import {PoolId} from "mira-dex-ts";

import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PromoBlock from "@/src/components/pages/liquidity-page/components/PromoBlock/PromoBlock";

import {ReserveItem} from "./reserve-item";
import {ExchangeRate} from "./exchange-rate";
import {MiraBlock} from "./mira-block";
import {PromoSparkle} from "@/meshwave-ui/src/components/icons";
import {DepositAmount} from "./deposit-amount";
import {useAssetPriceFromIndexer} from "@/src/hooks";
import {formatMoney} from "@/src/utils/formatMoney";
import SimulatedDistribution from "../../../bin-liquidity/components/simulated-distribution";
import {PoolType} from "@/src/components/common/PoolTypeIndicator";

export interface AssetData {
  amount: string;
  metadata: {
    name?: string;
    symbol?: string;
    decimals?: number;
  } & {isLoading: boolean};
  reserve?: number;
}

export function DesktopPositionView({
  pool,
  isStablePool,
  poolType,
  formattedTvlValue,
  positionPath,
  assetA,
  assetB,
  handleWithdrawLiquidity,
}: {
  pool: PoolId;
  isStablePool: boolean;
  poolType?: PoolType;
  formattedTvlValue: string;
  positionPath: string;
  assetA: AssetData;
  assetB: AssetData;
  handleWithdrawLiquidity: () => void;
}) {
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
          <Button variant="outline" onClick={handleWithdrawLiquidity}>
            Remove Liquidity
          </Button>
          <Link href={positionPath}>
            <Button>Add Liquidity</Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <MiraBlock pool={pool} />
        <div className="p-4 w-1/2 rounded-lg flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[11px] dark:border-0 dark:bg-background-grey-dark">
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

      <div className="w-full p-4 rounded-xl flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark">
        <div className="flex justify-between items-center mb-4">
          <div className="text-content-primary text-base leading-[19px]">
            Your liquidity
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

        <div className="border-b border-background-grey-light">
          <SimulatedDistribution />
        </div>

        <DepositAmount assetId={pool[0].bits} amount={assetA.amount} />
        <DepositAmount assetId={pool[1].bits} amount={assetB.amount} />
        {formattedTvlValue && (
          <div className="w-full h-0.5 bg-content-grey-dark dark:bg-white opacity-10" />
        )}

        <TotalDeposit
          assetAId={pool[0].bits}
          assetAmount={assetA.amount}
          assetBId={pool[0].bits}
          assetBmount={assetB.amount}
        />
      </div>

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

const TotalDeposit = ({
  assetAId,
  assetAmount,
  assetBId,
  assetBmount,
}: {
  assetAId: string;
  assetAmount: string;
  assetBId: string;
  assetBmount: string;
}) => {
  const {price: usdPrice} = useAssetPriceFromIndexer(assetAId);
  const valueOfAssetA = usdPrice ? usdPrice * parseFloat(assetAmount) : 0;
  const {price: usdPriceB} = useAssetPriceFromIndexer(assetBId);
  const valueOfAssetB = usdPrice ? usdPriceB * parseFloat(assetBmount) : 0;

  const usdValue = formatMoney(valueOfAssetA + valueOfAssetB);

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center justify-between text-content-tertiary">
        <p>Deposit balance:</p>
        <p className="font-alt">{usdValue}</p>
      </div>
    </div>
  );
};
