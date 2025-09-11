import React, {useState} from "react";
import Link from "next/link";
import {PoolId} from "mira-dex-ts";

import {Button} from "@/meshwave-ui/Button";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {Loader, CoinWithAmount} from "@/src/components/common";
import PromoBlock from "@/src/components/pages/liquidity-page/components/PromoBlock/PromoBlock";

import {AprDisplay} from "./apr-display";
import {ReserveItem} from "./reserve-item";
import {ExchangeRate} from "./exchange-rate";
import {MiraBlock} from "./mira-block";

import {formatDisplayAmount} from "@/src/utils/common";
import {PromoSparkle} from "@/meshwave-ui/src/components/icons";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";
import {PoolType} from "@/src/components/common/PoolTypeIndicator";

import {Dialog, DialogContent, DialogTrigger} from "@/meshwave-ui/modal";
import RemoveBinLiquidity from "../../../bin-liquidity/remove-bin-liquidity";

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
  poolType,
  formattedTvlValue,
  positionPath,
  assetA,
  assetB,
}: {
  pool: PoolId;
  isStablePool: boolean;
  poolType?: PoolType;
  formattedTvlValue: string;
  positionPath: string;
  assetA: AssetData;
  assetB: AssetData;
}) {
  const [openModal, setOpenModal] = useState(false);

  return (
    <section className="flex flex-col gap-3 mobileOnly">
      <div className="flex items-start justify-between">
        <CoinPair
          firstCoin={pool[0].bits}
          secondCoin={pool[1].bits}
          isStablePool={isStablePool}
          poolType={poolType ?? (isStablePool ? "v1-stable" : "v1-volatile")}
          withPoolDetails
        />
      </div>

      <div className="flex flex-col gap-[15px] p-4 rounded-ten bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark">
        <p className="text-base leading-[19px]">Your position</p>
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
        <p className="text-base leading-[19px]">Pool reserves</p>
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
          <p className="text-base font-normal leading-[19px]">
            Total value locked
          </p>
          {formattedTvlValue ? (
            <p className="text-content-tertiary">${formattedTvlValue}</p>
          ) : (
            <Loader color="gray" rebrand={getIsRebrandEnabled()} />
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
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger className="w-full">
            <Button variant="outline" size="lg" block>
              Remove Liquidity
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-[563px] p-0 bg-transaparent border-0"
            showCloseButton={false}
          >
            <RemoveBinLiquidity
              onClose={() => setOpenModal(() => false)}
              assetA={{
                amount: assetA.amount,
                metadata: assetA.metadata,
                reserve: assetA.reserve,
              }}
              assetB={{
                amount: assetB.amount,
                metadata: assetB.metadata,
                reserve: assetB.reserve,
              }}
            />
          </DialogContent>
        </Dialog>
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
