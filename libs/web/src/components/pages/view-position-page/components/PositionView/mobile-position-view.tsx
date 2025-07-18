import React from "react";
import Link from "next/link";
import {PoolId} from "mira-dex-ts";
import {Sparkles} from "lucide-react";

import {Button} from "@/meshwave-ui/Button";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {Loader, CoinWithAmount} from "@/src/components/common";
import PromoBlock from "@/src/components/pages/liquidity-page/components/PromoBlock/PromoBlock";

import { AprDisplay } from "./apr-display";
import { ReserveItem } from "./reserve-item";
import { ExchangeRate } from "./exchange-rate";
import { MiraBlock } from "./mira-block";

import {formatDisplayAmount} from "@/src/utils/common";

interface AssetData {
  amount: string;
  metadata: {
  name?: string;
  symbol?: string;
  decimals?: number;
  } & {isLoading: boolean};
  reserve?: number;
}

export function MobilePositionView({
  pool,
  isStablePool,
  formattedTvlValue,
  positionPath,
  assetA,
  assetB,
  handleWithdrawLiquidity,
}: {
  pool: PoolId;
  isStablePool: boolean;
  formattedTvlValue: string;
  positionPath: string;
  assetA: AssetData;
  assetB: AssetData;
  handleWithdrawLiquidity: () => void;
  
}){

  return (
    <section className="flex flex-col gap-3 mobileOnly">
      <div className="flex items-start justify-between">
        <CoinPair
          firstCoin={pool[0].bits}
          secondCoin={pool[1].bits}
          isStablePool={isStablePool}
          withPoolDescription
        />
      </div>

      <div className="flex flex-col gap-[15px] p-4 rounded-2xl bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark">
        <p className="text-[16px] font-bold leading-[19px]">Your position</p>
        <AprDisplay pool={pool} />
        <div className="flex justify-between">
          <CoinWithAmount
            assetId={pool[0].bits}
            amount={formatDisplayAmount(assetA.amount)}
          />
          <CoinWithAmount
            assetId={pool[1].bits}
            amount={formatDisplayAmount(assetB.amount)}
          />
        </div>
      </div>

      <MiraBlock pool={pool} />

      <div className="flex flex-col gap-3 my-[10px]">
        <p className="text-[16px] font-bold leading-[19px]">Pool reserves</p>
        <ReserveItem
          reserve={assetA.reserve}
          assetId={pool[0].bits}
          amount={assetA.amount}
        />
        <ReserveItem
          reserve={assetB.reserve}
          assetId={pool[1].bits}
          amount={assetB.amount}
        />

        <div className="w-full h-px border border-white opacity-10" />
        <div className="flex items-center justify-between text-content-tertiary">
          <p className="text-[16px] font-normal leading-[19px]">
            Total value locked
          </p>
          {formattedTvlValue ? (
            <p className="text-content-tertiary">${formattedTvlValue}</p>
          ) : (
            "loading"
          )}
        </div>
        <ExchangeRate
          assetBMetadata={assetB.metadata}
          assetAMetadata={assetA.metadata}
          coinAAmount={assetA.amount}
          coinBAmount={assetB.amount}
        />
      </div>

      <div className="w-full self-start">
        <Link href={positionPath}>
          <Button size="lg" block>
            Add Liquidity
          </Button>
        </Link>
      </div>
      <div className="w-full self-start">
        <Button
          variant="outline"
          onClick={handleWithdrawLiquidity}
          size="lg"
          block
        >
          Remove Liquidity
        </Button>
      </div>

      <PromoBlock
        icon={<Sparkles />}
        title="Learn about providing liquidity"
        link="https://mirror.xyz/miraly.eth"
        linkText="Click here and check our v3 LP walkthrough"
      />
    </section>
  );
};
