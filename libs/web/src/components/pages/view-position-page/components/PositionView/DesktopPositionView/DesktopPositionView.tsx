import React from "react";
import Link from "next/link";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {CoinWithAmount} from "@/src/components/common";
import PromoBlock from "@/src/components/pages/liquidity-page/components/PromoBlock/PromoBlock";
import {PoolId} from "mira-dex-ts";
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

interface DesktopPositionViewProps {
  pool: PoolId;
  isStablePool: boolean;
  formattedTvlValue: string;
  positionPath: string;
  assetA: AssetData;
  assetB: AssetData;
  handleWithdrawLiquidity: () => void;
}

const DesktopPositionView = ({
  pool,
  isStablePool,
  formattedTvlValue,
  positionPath,
  assetA,
  assetB,
  handleWithdrawLiquidity,
}: DesktopPositionViewProps) => {
  return (
    <section className="flex flex-col gap-3 desktopOnly">
      <div className="flex justify-between items-center">
        <div className="flex items-start justify-between gap-2">
          <CoinPair
            firstCoin={pool[0].bits}
            secondCoin={pool[1].bits}
            isStablePool={isStablePool}
            withPoolDescription
          />
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="secondary" onClick={handleWithdrawLiquidity}>
            Remove Liquidity
          </Button>
          <Link href={positionPath}>
            <Button>Add Liquidity</Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <MiraBlock pool={pool} />
        <div className="flex flex-col min-w-[350px] flex-1 w-full">
          <div className="flex flex-col gap-[15px] p-4 rounded-[16px] bg-background-grey-dark">
            <p className="text-[16px] font-semibold leading-[19px]">
              Your position
            </p>
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
        </div>
      </div>

      <div className="w-full p-4 rounded-[12px] flex flex-col gap-4 bg-background-grey-dark">
        <p className="text-[16px] font-semibold leading-[19px]">
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
        {formattedTvlValue && (
          <div className="w-full h-px border border-white opacity-10" />
        )}
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center justify-between">
            {formattedTvlValue && <p>Total value locked</p>}
            {formattedTvlValue && <p>${formattedTvlValue}</p>}
          </div>
          <ExchangeRate
            assetBMetadata={assetB.metadata}
            assetAMetadata={assetA.metadata}
            coinAAmount={assetA.amount}
            coinBAmount={assetB.amount}
          />
        </div>
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

export default DesktopPositionView;
