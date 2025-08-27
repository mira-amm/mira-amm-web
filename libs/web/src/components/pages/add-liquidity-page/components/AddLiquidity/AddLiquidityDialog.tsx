import {Dispatch, SetStateAction, useCallback, useState} from "react";
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
import {
  PoolTypeToggle,
  PoolTypeOption,
} from "@/src/components/common/PoolTypeToggle/PoolTypeToggle";
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
  const [poolType, setPoolType] = useState<PoolTypeOption>(
    isV2PoolDetected ? "v2" : "v1"
  );

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
    previewError,
  } = useLiquidityForm({
    poolId,
    firstAssetBalance,
    secondAssetBalance,
    onPreview: handlePreview,
    onPreviewError: handlePreviewError,
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

  return (
    <>
      <MockModeIndicator />
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-base text-[var(--content-primary)]">
            Selected pair
          </p>
          {/* Show pool type toggle for pools that support both v1 and v2, or in mock mode */}
          {(isV2PoolDetected || poolType === "v2" || isV2MockEnabled()) && (
            <PoolTypeToggle
              selectedType={poolType}
              onTypeChange={setPoolType}
              className="text-sm"
            />
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
            <CoinPair
              firstCoin={firstAssetId}
              secondCoin={secondAssetId}
              isStablePool={isStablePool}
            />
            <div className="flex flex-col items-end gap-1 pb-1 text-[12px] leading-[14px] lg:flex-row">
              <div className="flex items-center gap-1">
                <p className="text-sm">Estimated APR</p>
                <Info tooltipText={APRTooltip} />
              </div>
              {isMatching ? (
                <div>
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
                </div>
              ) : (
                <span
                  className={clsx(
                    aprValue && "text-content-positive pb-[2px]",
                    !aprValue && "text-content-dimmed-dark"
                  )}
                >
                  {aprValue ? `${aprValue}%` : "Awaiting data"}
                </span>
              )}
            </div>
          </div>
          {/* Pool type selection - only show for v1 pools */}
          {poolType === "v1" && (
            <div className="flex w-full gap-2">
              <div
                role="button"
                className={cn(
                  "flex w-full flex-col items-start gap-[10px] rounded-md bg-background-secondary dark:bg-background-secondary p-[10px_12px] text-content-dimmed-light cursor-not-allowed",
                  !isStablePool &&
                    "border dark:border-accent-primary dark:text-content-primary bg-background-primary text-white"
                )}
              >
                <div className="flex w-full">
                  <p className="flex-1 text-left">Volatile pool</p>
                  <Info tooltipText={VolatilePoolTooltip} />
                </div>
                <p>0.30% fee tier</p>
              </div>

              <div
                role="button"
                className={cn(
                  "flex w-full flex-col items-start gap-[10px] rounded-md bg-background-secondary dark:bg-background-secondary p-[10px_12px] text-content-dimmed-light cursor-not-allowed",
                  isStablePool &&
                    "border dark:border-accent-primary dark:text-content-primary bg-background-primary text-white"
                )}
              >
                <div className="flex w-full">
                  <p className="flex-1 text-left">Stable pool</p>
                  <Info tooltipText={StablePoolTooltip} />
                </div>
                <p>0.05% fee tier</p>
              </div>
            </div>
          )}

          {/* V2 concentrated liquidity configuration */}
          {poolType === "v2" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 w-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Concentrated Liquidity Pool (V2)
                </p>
              </div>

              {/* V2 Liquidity Configuration for bin selection */}
              <div className="w-full min-w-0">
                <V2LiquidityConfig
                  asset0Metadata={asset0Metadata}
                  asset1Metadata={asset1Metadata}
                  onConfigChange={setV2Config}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-base text-content-primary">Deposit amount</p>
        <div className="flex flex-col gap-3">
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
      {!isConnected ? (
        <Button onClick={connect} disabled={isConnecting} size="2xl">
          Connect Wallet
        </Button>
      ) : (
        <Button
          disabled={finalButtonDisabled}
          onClick={finalHandleButtonClick}
          size="2xl"
        >
          {finalButtonTitle}
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
