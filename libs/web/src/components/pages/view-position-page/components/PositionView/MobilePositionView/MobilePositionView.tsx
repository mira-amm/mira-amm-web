import React from "react";
import Link from "next/link";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {CoinWithAmount} from "@/src/components/common";
import PromoBlock from "@/src/components/pages/liquidity-page/components/PromoBlock/PromoBlock";
import {PoolId} from "mira-dex-ts";
import {Loader} from "@/src/components/common";
import AprDisplay from "../AprDisplay/AprDisplay";
import ReserveItem from "../ReserveItem/ReserveItem";
import ExchangeRate from "../ExchangeRate/ExchangeRate";
import MiraBlock from "../MiraBlock/MiraBlock";
import {formatDisplayAmount} from "@/src/utils/common";
import {Sparkles} from "lucide-react";
import {Button} from "@/meshwave-ui/Button";

interface AssetMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
}

interface AssetData {
  amount: string;
  metadata: AssetMetadata & {isLoading: boolean};
  reserve?: number;
}

interface MobilePositionViewProps {
  pool: PoolId;
  isStablePool: boolean;
  formattedTvlValue: string;
  positionPath: string;
  assetA: AssetData;
  assetB: AssetData;
  handleWithdrawLiquidity: () => void;
}

const MobilePositionView = ({
  pool,
  isStablePool,
  formattedTvlValue,
  positionPath,
  assetA,
  assetB,
  handleWithdrawLiquidity,
}: MobilePositionViewProps) => {
  const loading = <Loader variant="outlined" color="gray" />;

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

      <div className="flex flex-col gap-[15px] p-4 rounded-2xl bg-background-grey-dark">
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
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-normal leading-[19px]">
            Total value locked
          </p>
          {formattedTvlValue ? <p>${formattedTvlValue}</p> : loading}
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
          <Button block>Add Liquidity</Button>
        </Link>
      </div>
      <div className="w-full self-start">
        <Button variant="secondary" onClick={handleWithdrawLiquidity} block>
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

export default MobilePositionView;
