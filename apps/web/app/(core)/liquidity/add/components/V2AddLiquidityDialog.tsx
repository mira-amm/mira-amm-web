import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {Button} from "@/meshwave-ui/Button";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {PoolId} from "mira-dex-ts";
import {useDocumentTitle} from "usehooks-ts";
import {BN} from "fuels";

import CoinInput from "@/src/components/pages/add-liquidity-page/components/CoinInput/CoinInput";
import {Info, TransactionFailureModal} from "@/src/components/common";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {AprBadge} from "@/src/components/common/AprBadge/AprBadge";
import {usePoolNameAndMatch} from "@/src/hooks/usePoolNameAndMatch";
import {useModal} from "@/src/hooks";
import {AddLiquidityPreviewData} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";
import {APRTooltip} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/addLiquidityTooltips";

import {usePoolAssetsV2} from "@/src/hooks/usePoolAssetsV2";
import {useLiquidityForm} from "@/src/hooks/useLiquidityForm";
import {useLiquidityFormV2Integration} from "@/src/hooks/useLiquidityFormV2Integration";
import {MockModeIndicator} from "@/src/components/common/MockModeIndicator/MockModeIndicator";
import V2LiquidityConfig from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/V2LiquidityConfig";

// Reusable heading component with consistent styling
const SectionHeading = ({children}: {children: React.ReactNode}) => (
  <h3 className="text-base  text-content-primary" style={{fontSize: "16px"}}>
    {children}
  </h3>
);

const V2AddLiquidityDialog = ({
  poolId,
  setPreviewData,
  poolKey,
}: {
  poolId: BN;
  setPreviewData: Dispatch<SetStateAction<AddLiquidityPreviewData | null>>;
  poolKey: string;
}) => {
  const [FailureModal, openFailureModal, closeFailureModal] = useModal();
  const {isConnected, isPending: isConnecting} = useIsConnected();
  const {connect} = useConnectUI();

  // V2 liquidity configuration state
  const [v2Config, setV2Config] = useState<{
    liquidityShape: string;
    priceRange: [number, number];
    numBins: number;
    binResults?: any;
    liquidityDistribution?: any;
    deltaDistribution?: any;
  } | null>(null);

  // Get pool assets info (V2-compatible)
  const {
    firstAssetId,
    secondAssetId,
    firstAssetBalance,
    secondAssetBalance,
    asset0Price,
    asset1Price,
  } = usePoolAssetsV2(poolId);

  // Create a mock V1-style poolId for form hooks that expect V1 format
  // This allows us to reuse V1 form logic while working with V2 pools
  const mockPoolIdForForm: PoolId = useMemo(() => {
    if (!firstAssetId || !secondAssetId) {
      // Fallback if assets aren't loaded yet
      return [{bits: ""}, {bits: ""}, false];
    }
    return [
      {bits: firstAssetId},
      {bits: secondAssetId},
      false, // V2 pools don't have stable/volatile distinction
    ];
  }, [firstAssetId, secondAssetId]);

  // Check if the pool with rewards matches the current pool
  const {isMatching} = usePoolNameAndMatch(poolKey);

  // Handle preview errors
  const handlePreviewError = useCallback(() => {
    openFailureModal();
  }, [openFailureModal]);

  // Handle preview data for v2 flows
  const handlePreview = useCallback(
    (data: any) => {
      const assets =
        data?.assets && Array.isArray(data.assets)
          ? data.assets
          : [
              {
                assetId: firstAssetId || "",
                amount: new BN(data?.firstAmount || "0"),
              },
              {
                assetId: secondAssetId || "",
                amount: new BN(data?.secondAmount || "0"),
              },
            ];

      const preview: AddLiquidityPreviewData = {
        ...(data || {}),
        assets,
        isStablePool: false, // V2 pools don't have stable/volatile distinction
        type: "v2-concentrated",
        poolId: poolId.toString(),
        binStrategy: v2Config?.liquidityShape,
        numBins: v2Config?.numBins,
        priceRange: v2Config?.priceRange,
        liquidityDistribution: v2Config?.liquidityDistribution,
        deltaDistribution: v2Config?.deltaDistribution,
      };

      setPreviewData(preview);
    },
    [setPreviewData, firstAssetId, secondAssetId, poolId, v2Config]
  );

  const {
    firstAmountInput,
    secondAmountInput,
    firstAmount,
    secondAmount,
    setAmountForCoin,
    clearFirstAmount,
    clearSecondAmount,
    aprValue,
    tvlValue,
    isFetching,
    isFirstToken,
    asset0Metadata,
    asset1Metadata,
    previewError,
  } = useLiquidityForm({
    poolId: mockPoolIdForForm, // Use mock V1-style poolId for compatibility
    firstAssetBalance,
    secondAssetBalance,
    onPreview: handlePreview,
    onPreviewError: handlePreviewError,
    enableAutoSync: false, // V2 doesn't auto-sync amounts
  });

  // V2 integration for concentrated liquidity
  const v2Integration = useLiquidityFormV2Integration({
    poolType: "v2",
    firstAmount: firstAmount || new BN(0),
    secondAmount: secondAmount || new BN(0),
    poolId: poolId,
    onPreview: handlePreview,
    v2Config, // Pass the v2 configuration to the integration hook
  });

  // Set document title
  useDocumentTitle(
    `Add Liquidity: ${asset0Metadata.symbol}/${asset1Metadata.symbol}`
  );

  // Determine out-of-range states for disabling inputs in v2
  const currentPrice =
    asset1Price && asset0Price ? asset1Price / asset0Price : 1;
  const isOutOfRangeLow = Boolean(
    v2Config && currentPrice !== null && currentPrice < v2Config.priceRange[0]
  );
  const isOutOfRangeHigh = Boolean(
    v2Config && currentPrice !== null && currentPrice > v2Config.priceRange[1]
  );

  // Clear the irrelevant amount when out of range
  useEffect(() => {
    if (!v2Config || currentPrice === null) return;
    if (isOutOfRangeLow) {
      // Price below range → only second asset (asset1) is needed → clear first
      clearFirstAmount();
    } else if (isOutOfRangeHigh) {
      // Price above range → only first asset (asset0) is needed → clear second
      clearSecondAmount();
    }
  }, [
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
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <SectionHeading>Selected pair</SectionHeading>
        </div>

        <div className="flex gap-2 flex-col sm:flex-row justify-between sm:items-center">
          <CoinPair
            firstCoin={firstAssetId}
            secondCoin={secondAssetId}
            isStablePool={false}
            poolType="v2-concentrated"
            withPoolDetails
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
              <span className="text-sm  text-content-primary ml-1">
                {aprValue ? `${aprValue}%` : "88.78%"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content layout */}
      <div className="flex flex-col gap-6 mb-6">
        {/* Deposit amounts */}
        <div className="space-y-4">
          <SectionHeading>Deposit amounts</SectionHeading>
          <div className="space-y-3">
            <CoinInput
              assetId={firstAssetId}
              value={firstAmountInput}
              loading={!isFirstToken && isFetching}
              setAmount={(val) => setAmountForCoin(firstAssetId || "", val)}
              balance={firstAssetBalance}
              usdRate={asset0Price || undefined}
              isOutOfRange={isOutOfRangeLow}
            />
            <CoinInput
              assetId={secondAssetId}
              value={secondAmountInput}
              loading={isFirstToken && isFetching}
              setAmount={(val) => setAmountForCoin(secondAssetId || "", val)}
              balance={secondAssetBalance}
              usdRate={asset1Price || undefined}
              isOutOfRange={isOutOfRangeHigh}
            />
          </div>
        </div>

        {/* V2 Configuration (Liquidity Shape, Price Range, Distribution) */}
        <V2LiquidityConfig
          asset0Metadata={asset0Metadata}
          asset1Metadata={asset1Metadata}
          currentPrice={currentPrice}
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
      </div>

      {/* Connect/Submit Button */}
      {!isConnected ? (
        <Button onClick={connect} disabled={isConnecting} size="2xl">
          Connect Wallet
        </Button>
      ) : (
        <Button
          disabled={v2Integration.v2ButtonDisabled}
          onClick={v2Integration.handleV2ButtonClick}
          size="2xl"
        >
          {v2Integration.v2ButtonTitle || "Input amounts"}
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

export default V2AddLiquidityDialog;
