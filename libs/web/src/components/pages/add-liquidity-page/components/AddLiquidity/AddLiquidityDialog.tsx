import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import {Button} from "@/meshwave-ui/Button";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {PoolId} from "mira-dex-ts";
import {useDocumentTitle} from "usehooks-ts";
import {clsx} from "clsx";
import {BN} from "fuels";

import CoinInput from "@/src/components/pages/add-liquidity-page/components/CoinInput/CoinInput";
import {Info, TransactionFailureModal} from "@/src/components/common";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {AprBadge} from "@/src/components/common/AprBadge/AprBadge";
import {PoolTypeOption} from "@/src/components/common/PoolTypeToggle/PoolTypeToggle";
import {usePoolNameAndMatch} from "@/src/hooks/usePoolNameAndMatch";
import {useModal} from "@/src/hooks";
import {AddLiquidityPreviewData} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";

import {
  APRTooltip,
  StablePoolTooltip,
  VolatilePoolTooltip,
} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/addLiquidityTooltips";
import {cn} from "@/src/utils/cn";

import {usePoolAssets} from "@/src/hooks/usePoolAssets";
import {useLiquidityForm} from "@/src/hooks/useLiquidityForm";
import {useLiquidityFormV2Integration} from "@/src/hooks/useLiquidityFormV2Integration";
import {isV2PoolId} from "@/src/utils/poolTypeDetection";
import {isV2MockEnabled} from "@/src/utils/mockConfig";
import {MockModeIndicator} from "@/src/components/common/MockModeIndicator/MockModeIndicator";
import V2LiquidityConfig from "./V2LiquidityConfig";

// Reusable heading component with consistent styling
const SectionHeading = ({children}: {children: React.ReactNode}) => (
  <h3
    className="text-base font-medium text-content-primary"
    style={{fontSize: "16px"}}
  >
    {children}
  </h3>
);

const AddLiquidityDialog = ({
  poolId,
  setPreviewData,
  poolKey,
}: {
  poolId: PoolId;
  setPreviewData: Dispatch<SetStateAction<AddLiquidityPreviewData | null>>;
  poolKey: string;
}) => {
  const [FailureModal, openFailureModal, closeFailureModal] = useModal();
  const {isConnected, isPending: isConnecting} = useIsConnected();
  const {connect} = useConnectUI();

  // Detect if this is a v2 pool and manage pool type state
  const isV2PoolDetected = isV2PoolId(poolId);
  const [_, setPoolType] = useState<PoolTypeOption>(
    isV2PoolDetected ? "v2" : "v1"
  );

  const poolType = "v2";

  // V2 liquidity configuration state
  const [v2Config, setV2Config] = useState<{
    liquidityShape: string;
    priceRange: [number, number];
    numBins: number;
    binResults?: any;
    liquidityDistribution?: any;
  } | null>(null);

  // Convert v1 PoolId to v2 pool ID if needed
  const v2PoolId =
    isV2PoolDetected && poolId instanceof BN ? poolId : undefined;

  // Get pool assets info
  const {
    firstAssetId,
    secondAssetId,
    firstAssetBalance,
    secondAssetBalance,
    asset0Price,
    asset1Price,
  } = usePoolAssets(poolKey);

  // Check if the pool with rewards matches the current pool
  const {isMatching} = usePoolNameAndMatch(poolKey);

  // Handle preview errors
  const handlePreviewError = useCallback(() => {
    openFailureModal();
  }, [openFailureModal]);

  // Handle preview action
  const handlePreview = useCallback(
    (data: AddLiquidityPreviewData) => {
      setPreviewData(data);
    },
    [setPreviewData]
  );

  const {
    firstAmountInput,
    secondAmountInput,
    firstAmount,
    secondAmount,
    setAmountForCoin,
    clearFirstAmount,
    clearSecondAmount,
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
    previewError,
  } = useLiquidityForm({
    poolId,
    firstAssetBalance,
    secondAssetBalance,
    onPreview: handlePreview,
    onPreviewError: handlePreviewError,
    enableAutoSync: poolType !== "v2",
  });

  // V2 integration for concentrated liquidity
  const v2Integration = useLiquidityFormV2Integration({
    poolType,
    firstAmount: firstAmount || new BN(0),
    secondAmount: secondAmount || new BN(0),
    poolId: v2PoolId,
    onPreview: handlePreview,
    v2Config, // Pass the v2 configuration to the integration hook
  });

  // Use v2 logic if pool type is v2, otherwise use v1 logic
  const finalButtonTitle = v2Integration.shouldUseV2
    ? v2Integration.v2ButtonTitle || buttonTitle
    : buttonTitle;

  const finalButtonDisabled = v2Integration.shouldUseV2
    ? v2Integration.v2ButtonDisabled
    : buttonDisabled;

  const finalHandleButtonClick = v2Integration.shouldUseV2
    ? v2Integration.handleV2ButtonClick
    : handleButtonClick;

  // Set document title
  useDocumentTitle(
    `Add Liquidity: ${asset0Metadata.symbol}/${asset1Metadata.symbol}`
  );

  // Determine out-of-range states for disabling inputs in v2
  const currentPrice =
    asset1Price && asset0Price ? asset1Price / asset0Price : 1;
  const isOutOfRangeLow = Boolean(
    poolType === "v2" &&
      v2Config &&
      currentPrice !== null &&
      currentPrice < v2Config.priceRange[0]
  );
  const isOutOfRangeHigh = Boolean(
    poolType === "v2" &&
      v2Config &&
      currentPrice !== null &&
      currentPrice > v2Config.priceRange[1]
  );

  // Clear the irrelevant amount when out of range
  useEffect(() => {
    if (poolType !== "v2" || !v2Config || currentPrice === null) return;
    if (isOutOfRangeLow) {
      // Price below range → only second asset (asset1) is needed → clear first
      clearFirstAmount();
    } else if (isOutOfRangeHigh) {
      // Price above range → only first asset (asset0) is needed → clear second
      clearSecondAmount();
    }
  }, [
    poolType,
    v2Config,
    currentPrice,
    isOutOfRangeLow,
    isOutOfRangeHigh,
    clearFirstAmount,
    clearSecondAmount,
  ]);

  return (
    <>
      <MockModeIndicator />

      {/* Selected pair section */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <SectionHeading>Selected pair</SectionHeading>
        </div>

        <div className="flex justify-between items-center">
          <CoinPair
            firstCoin={firstAssetId}
            secondCoin={secondAssetId}
            isStablePool={isStablePool}
          />

          <div className="flex items-center gap-1">
            <span className="text-sm text-content-primary">Estimated APR</span>
            <Info tooltipText={APRTooltip} />
            {isMatching ? (
              <AprBadge
                aprValue={
                  aprValue === "NaN"
                    ? "n/a"
                    : aprValue
                      ? `${aprValue}%`
                      : "pending"
                }
                small
                leftAlignValue="-200px"
                poolKey={poolKey}
                tvlValue={tvlValue}
                background="black"
              />
            ) : (
              <span className="text-sm font-medium text-content-primary ml-1">
                {aprValue ? `${aprValue}%` : "88.78%"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fee tier selection for v1 pools */}
      {poolType === "v1" && (
        <div className="flex w-full gap-3 mb-6">
          <div
            role="button"
            className={cn(
              "flex w-full flex-col items-start gap-[10px] rounded-lg bg-background-secondary dark:bg-background-secondary p-[12px_16px] text-content-dimmed-light cursor-not-allowed",
              !isStablePool &&
                "border dark:border-accent-primary dark:text-content-primary bg-background-primary text-white"
            )}
          >
            <div className="flex w-full">
              <p className="flex-1 text-left font-medium">Volatile pool</p>
              <Info tooltipText={VolatilePoolTooltip} />
            </div>
            <p className="text-sm">0.30% fee tier</p>
          </div>

          <div
            role="button"
            className={cn(
              "flex w-full flex-col items-start gap-[10px] rounded-lg bg-background-secondary dark:bg-background-secondary p-[12px_16px] text-content-dimmed-light cursor-not-allowed",
              isStablePool &&
                "border dark:border-accent-primary dark:text-content-primary bg-background-primary text-white"
            )}
          >
            <div className="flex w-full">
              <p className="flex-1 text-left font-medium">Stable pool</p>
              <Info tooltipText={StablePoolTooltip} />
            </div>
            <p className="text-sm">0.05% fee tier</p>
          </div>
        </div>
      )}

      {/* Main content layout - Single column for all pool types */}
      <div className="flex flex-col gap-6 mb-6">
        {/* Deposit amounts */}
        <div className="space-y-4">
          <SectionHeading>Deposit amounts</SectionHeading>
          <div className="space-y-3">
            <CoinInput
              assetId={firstAssetId}
              value={firstAmountInput}
              loading={(!isFirstToken && isFetching) || isOutOfRangeLow}
              setAmount={(val) => setAmountForCoin(poolId[0].bits, val)}
              balance={firstAssetBalance}
              usdRate={asset0Price || undefined}
            />
            <CoinInput
              assetId={secondAssetId}
              value={secondAmountInput}
              loading={(isFirstToken && isFetching) || isOutOfRangeHigh}
              setAmount={(val) => setAmountForCoin(poolId[1].bits, val)}
              balance={secondAssetBalance}
              usdRate={asset1Price || undefined}
            />
          </div>
        </div>

        {/* V2 Configuration (Liquidity Shape, Price Range, Distribution) */}
        {poolType === "v2" && (
          <V2LiquidityConfig
            asset0Metadata={asset0Metadata}
            asset1Metadata={asset1Metadata}
            currentPrice={
              asset1Price && asset0Price ? asset1Price / asset0Price : 1.0
            }
            asset0Price={asset0Price || undefined}
            asset1Price={asset1Price || undefined}
            totalAsset0Amount={
              firstAmount
                ? parseFloat(
                    firstAmount.formatUnits(asset0Metadata.decimals || 0)
                  )
                : undefined
            }
            totalAsset1Amount={
              secondAmount
                ? parseFloat(
                    secondAmount.formatUnits(asset1Metadata.decimals || 0)
                  )
                : undefined
            }
            onConfigChange={setV2Config}
          />
        )}
      </div>

      {/* Connect/Submit Button */}
      {!isConnected ? (
        <Button onClick={connect} disabled={isConnecting} size="2xl">
          Connect Wallet
        </Button>
      ) : (
        <Button
          disabled={finalButtonDisabled}
          onClick={finalHandleButtonClick}
          size="2xl"
          className={
            poolType === "v2"
              ? "bg-green-600 hover:bg-green-700 text-white py-3"
              : ""
          }
        >
          {poolType === "v2" ? "Input amounts" : finalButtonTitle}
        </Button>
      )}

      <FailureModal title={<></>}>
        <TransactionFailureModal
          error={previewError || v2Integration.v2Error}
          closeModal={closeFailureModal}
        />
      </FailureModal>
    </>
  );
};

export default AddLiquidityDialog;
