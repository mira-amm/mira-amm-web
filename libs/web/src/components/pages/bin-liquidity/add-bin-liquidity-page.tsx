"use client";

import Link from "next/link";
import {ChevronLeft, CircleQuestionMark} from "lucide-react";
import CoinPair from "../../common/CoinPair/CoinPair";
import LiquidityManager from "./components/liquidity-manager";
import {AprBadge} from "../../common/AprBadge/AprBadge";
import CoinInput from "../add-liquidity-page/components/CoinInput/CoinInput";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {Button} from "@/meshwave-ui/Button";

// Import our custom hooks
import {usePoolAssets} from "@/src/hooks/usePoolAssets";
import {useLiquidityForm} from "@/src/hooks/useLiquidityForm";

const AddBinLiquidityPage = ({poolKey}: {poolKey: string}) => {
  const {isConnected, isPending: isConnecting} = useIsConnected();
  const {connect} = useConnectUI();

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
                    isStablePool={isStablePool}
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

            <LiquidityManager
              asset0Metadata={asset0Metadata}
              asset1Metadata={asset1Metadata}
            />

            {!isConnected ? (
              <Button onClick={connect} disabled={isConnecting} size="2xl">
                Connect Wallet
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
