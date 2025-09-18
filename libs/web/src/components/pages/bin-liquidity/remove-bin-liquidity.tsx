"use client";

import {ChevronLeft} from "lucide-react";
import {useState, useMemo} from "react";
import {BN} from "fuels";
import {Button} from "@/meshwave-ui/Button";
import PriceSummary from "./components/price-summary";
import {type PoolTypeOption} from "../../common/PoolTypeToggle/PoolTypeToggle";
import {useUserBinPositionsV2, useRemoveAllBinsV2} from "@/src/hooks";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {Info} from "@/src/components/common";

interface AssetData {
  amount: string;
  metadata: {
    name?: string;
    symbol?: string;
    decimals?: number;
  } & {isLoading: boolean};
  reserve?: number;
}

const RemoveBinLiquidity = ({
  onClose,
  assetA,
  assetB,
  v2PoolId,
}: {
  onClose?: () => void;
  assetA: AssetData;
  assetB: AssetData;
  v2PoolId?: BN;
}) => {
  const {isConnected} = useIsConnected();
  const {connect} = useConnectUI();

  // V2 position management
  const {data: v2Positions, isLoading: v2Loading} =
    useUserBinPositionsV2(v2PoolId);

  const {mutateAsync: removeAllBinsV2, isPending: v2RemovePending} =
    useRemoveAllBinsV2({
      poolId: v2PoolId || new BN(0),
      userPositions: v2Positions || [],
      slippage: 50, // 0.5% slippage
    });

  // Handle v2 removal
  const handleV2Remove = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    try {
      await removeAllBinsV2();
      onClose?.();
    } catch (error) {
      console.error("Failed to remove v2 liquidity:", error);
    }
  };

  const hasV2Positions = (v2Positions?.length || 0) > 0;

  return (
    <div className="flex flex-col gap-4 mx-auto w-full">
      <button
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
        onClick={onClose}
      >
        <ChevronLeft className="size-5" />
        Back to Pool
      </button>
      <section className="flex flex-col gap-3">
        <div className="w-full p-4 pb-10 rounded-[12px] flex flex-col gap-6 bg-background-grey-dark border-border-secondary border-[11px] dark:border-0 dark:bg-background-grey-dark">
          <p className="flex items-center gap-x-1 text-lg text-content-primary leading-[19px] border-b border-content-grey-dark/40 pb-3">
            Remove Liquidity
            <Info
              tooltipText={
                "This action will remove all your liquidity in this pool. If you want to rebalance the pool, you'll need to add liquidity back into the pool after this action."
              }
            />
          </p>

          <PriceSummary
            assetA={assetA}
            assetB={assetB}
            userPositions={v2Positions}
            slippage={50}
          />

          {!isConnected ? (
            <Button onClick={connect} size="2xl">
              Connect Wallet
            </Button>
          ) : (
            <Button
              size="2xl"
              onClick={handleV2Remove}
              disabled={!hasV2Positions || v2RemovePending}
            >
              {v2RemovePending ? "Removing..." : "Confirm V2 Removal"}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default RemoveBinLiquidity;
