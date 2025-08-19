import {Dispatch, SetStateAction, useCallback} from "react";
import {Button} from "@/meshwave-ui/Button";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {PoolId} from "mira-dex-ts";
import {useDocumentTitle} from "usehooks-ts";
import {clsx} from "clsx";

import CoinInput from "@/src/components/pages/add-liquidity-page/components/CoinInput/CoinInput";
import {Info, TransactionFailureModal} from "@/src/components/common";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {AprBadge} from "@/src/components/common/AprBadge/AprBadge";
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

  // Set document title
  useDocumentTitle(
    `Add Liquidity: ${asset0Metadata.symbol}/${asset1Metadata.symbol}`
  );

  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="text-base text-[var(--content-primary)]">Selected pair</p>
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
          disabled={buttonDisabled}
          onClick={handleButtonClick}
          size="2xl"
        >
          {buttonTitle}
        </Button>
      )}
      <FailureModal title={<></>}>
        <TransactionFailureModal
          error={previewError}
          closeModal={closeFailureModal}
        />
      </FailureModal>
    </>
  );
};

export default AddLiquidityDialog;
