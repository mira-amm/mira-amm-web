"use client";

import Link from "next/link";
import {ChevronLeft, CircleQuestionMark} from "lucide-react";
import CoinPair from "../../common/CoinPair/CoinPair";
import LiquidityManager from "./components/liquidity-manager";
import {AprBadge} from "../../common/AprBadge/AprBadge";
import CoinInput from "../add-liquidity-page/components/CoinInput/CoinInput";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {Button} from "@/meshwave-ui/Button";
import {type PoolTypeOption} from "../../common/PoolTypeToggle/PoolTypeToggle";
import {useState} from "react";

// Import our custom hooks
import {usePoolAssets} from "@/src/hooks/usePoolAssets";
import {useLiquidityForm} from "@/src/hooks/useLiquidityForm";
import {useLiquidityFormV2Integration} from "@/src/hooks/useLiquidityFormV2Integration";
import {BN} from "fuels";
import {getUiPoolTypeFromPoolId} from "@/src/utils/poolTypeDetection";

const AddBinLiquidityPage = ({
  poolKey,
  poolType = "v1",
  v2PoolId,
}: {
  poolKey: string;
  poolType?: PoolTypeOption;
  v2PoolId?: BN;
}) => {
  const {isConnected, isPending: isConnecting} = useIsConnected();
  const {connect} = useConnectUI();
  const [selectedPoolType, setSelectedPoolType] =
    useState<PoolTypeOption>(poolType);

  // Use the pool assets hook
  const {
    poolId,
    firstAssetId,
    secondAssetId,
    isStablePool: defaultIsStablePool,
    firstAssetBalance,
    secondAssetBalance,
    asset0Price,
    asset1Price,
  } = usePoolAssets(poolKey);

  // Use the main liquidity form hook
  const {
    firstAmount,
    firstAmountInput,
    secondAmount,
    secondAmountInput,
    setAmount,
    isStablePool,
    aprValue,
    tvlValue,
    isFetching,
    isFirstToken,
    buttonTitle,
    buttonDisabled,
    handleButtonClick,
    asset0Metadata,
    asset1Metadata,
  } = useLiquidityForm({
    poolId,
    firstAssetBalance,
    secondAssetBalance,
    enableAutoSync: selectedPoolType !== "v2",
  });

  // V2 integration hook
  const {
    shouldUseV2,
    handleV2ButtonClick,
    v2ButtonTitle,
    v2ButtonDisabled,
    v2IsPending,
  } = useLiquidityFormV2Integration({
    poolType: selectedPoolType,
    firstAmount,
    secondAmount,
    poolId: v2PoolId,
  });

  return (
    <>
      <main className="flex flex-col gap-4 mx-auto lg:w-[716px] w-full lg:px-4 lg:py-8">
        <Link
          href="/liquidity"
          className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
        >
          <ChevronLeft className="size-5" />
          Back to Pool
        </Link>
        <section className="flex flex-col gap-3">
          <div className="w-full p-4 rounded-[12px] flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[11px] dark:border-0 dark:bg-background-grey-dark">
            <p className="text-base text-content-primary leading-[19px] border-b border-content-grey-dark/40 pb-3">
              Add Liqudity
            </p>

            <div>
              <div className="text-content-primary mb-2 text-base">
                Selected Pair
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-start justify-between gap-2">
                  <CoinPair
                    firstCoin={firstAssetId}
                    secondCoin={secondAssetId}
                    isStablePool={
                      selectedPoolType === "v1" ? isStablePool : false
                    }
                    poolType={getUiPoolTypeFromPoolId(poolId)}
                    withPoolDetails
                  />
                </div>
                <div className="flex items-center">
                  <div className="flex items-center gap-x-1">
                    <span className="text-content-primary">Estimated Apr</span>
                    <CircleQuestionMark className="size-4 text-content-primary bg-text-content-grey-dark" />
                  </div>
                  <AprBadge
                    aprValue={aprValue}
                    poolKey={poolKey}
                    tvlValue={tvlValue}
                    background="black"
                  />
                </div>
              </div>
            </div>

            {selectedPoolType === "v1" ? (
              <div className="flex items-center gap-2">
                <div className="border border-content-tertiary rounded-md flex w-full">
                  {[
                    {
                      id: "0.30",
                      text: "0.30% fee tier (volatile pool)",
                      isStablePool: !isStablePool,
                    },
                    {
                      id: "0.05",
                      text: "0.05% fee tier (stable pool)",
                      isStablePool,
                    },
                  ].map((period, index, array) => (
                    <button
                      key={period.id}
                      className={`px-3.5 py-2.5 text-sm transition-all w-1/2 ${
                        period.isStablePool
                          ? "bg-background-primary text-page-background"
                          : "text-background-primary"
                      } ${
                        index === 0
                          ? "rounded-l-md"
                          : index === array.length - 1
                            ? "rounded-r-md"
                            : ""
                      }`}
                    >
                      {period.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Concentrated Liquidity Pool:</strong> Variable fee
                  tier based on pool configuration. Fees are distributed
                  proportionally to liquidity providers in active price ranges.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="text-content-primary text-base">
                Deposited amounts
              </div>

              <div className="space-y-2">
                <CoinInput
                  assetId={firstAssetId}
                  value={firstAmountInput}
                  loading={!isFirstToken && isFetching}
                  setAmount={setAmount(poolId[0].bits)}
                  balance={firstAssetBalance}
                  usdRate={asset0Price || undefined}
                />
                <CoinInput
                  assetId={secondAssetId}
                  value={secondAmountInput}
                  loading={isFirstToken && isFetching}
                  setAmount={setAmount(poolId[1].bits)}
                  balance={secondAssetBalance}
                  usdRate={asset1Price || undefined}
                />
              </div>
            </div>

            {selectedPoolType === "v1" ? (
              <LiquidityManager
                asset0Metadata={asset0Metadata}
                asset1Metadata={asset1Metadata}
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Simple Mode:</strong> Your liquidity will be added
                    to the active price bin only, similar to traditional AMM
                    behavior. For advanced bin distribution strategies, use the
                    full concentrated liquidity interface.
                  </p>
                </div>
                <div className="text-content-primary text-base">
                  Liquidity will be concentrated in the active price bin for
                  maximum capital efficiency.
                </div>
              </div>
            )}

            {!isConnected ? (
              <Button onClick={connect} disabled={isConnecting} size="2xl">
                Connect Wallet
              </Button>
            ) : shouldUseV2 ? (
              <Button
                disabled={v2ButtonDisabled}
                onClick={handleV2ButtonClick}
                size="2xl"
              >
                {v2IsPending ? "Processing..." : v2ButtonTitle}
              </Button>
            ) : (
              <Button
                disabled={buttonDisabled}
                onClick={handleButtonClick}
                size="2xl"
              >
                {buttonTitle}
              </Button>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default AddBinLiquidityPage;
