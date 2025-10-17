import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {Coin, TransactionFailureModal} from "@/src/components/common";
import {
  useAddLiquidity,
  useAddLiquidityV2,
  useModal,
  useAssetMetadata,
} from "@/src/hooks";
import AddLiquiditySuccessModal from "@/src/components/pages/add-liquidity-page/components/AddLiquiditySuccessModal/AddLiquiditySuccessModal";
import {useRouter} from "next/navigation";
import {Dispatch, SetStateAction, useCallback} from "react";
import {BN} from "fuels";
import {Button} from "@/meshwave-ui/Button";
import {mapUiPoolTypeFromStableFlag} from "@/src/utils/poolTypeDetection";

export type AddLiquidityPreviewData = {
  assets: {
    assetId: string;
    amount: BN;
  }[];
  isStablePool: boolean;
  // V2 specific fields
  type?: "v1" | "v2-concentrated";
  poolId?: string;
  firstAmount?: string;
  secondAmount?: string;
  binStrategy?: string;
  numBins?: number;
  priceRange?: [number, number];
  liquidityDistribution?: any;
  deltaDistribution?: any;
  isMock?: boolean;
  mockResult?: any;
};

export default function PreviewAddLiquidityDialog({
  previewData,
  setPreviewData,
  slippage,
}: {
  previewData: AddLiquidityPreviewData;
  setPreviewData: Dispatch<SetStateAction<AddLiquidityPreviewData | null>>;
  slippage: number;
}) {
  const [SuccessModal, openSuccessModal] = useModal();
  const [FailureModal, openFailureModal, closeFailureModal] = useModal();

  const router = useRouter();

  const {assets, isStablePool, poolId} = previewData;

  const firstAssetMetadata = useAssetMetadata(assets[0].assetId);
  const secondAssetMetadata = useAssetMetadata(assets[1].assetId);

  const firstAssetAmount = assets[0].amount;
  const secondAssetAmount = assets[1].amount;

  const isV2 = previewData.type === "v2-concentrated";

  // V1 add liquidity hook
  const {
    data: v1Data,
    mutateAsync: v1MutateAsync,
    isPending: v1IsPending,
    error: v1Error,
  } = useAddLiquidity({
    firstAsset: previewData.assets[0].assetId,
    firstAssetAmount,
    secondAsset: previewData.assets[1].assetId,
    secondAssetAmount,
    isPoolStable: isStablePool,
    slippage,
  });

  // V2 add liquidity hook (concentrated/binned pools)
  const v2PoolId = new BN(poolId || "0");
  const {
    data: v2Data,
    mutateAsync: v2MutateAsync,
    isPending: v2IsPending,
    error: v2Error,
  } = useAddLiquidityV2({
    poolId: v2PoolId,
    firstAssetAmount,
    secondAssetAmount,
    slippage,
    liquidityDistribution: previewData.liquidityDistribution,
    deltaDistribution: (previewData as any).deltaDistribution,
  });

  const data = isV2 ? v2Data : v1Data;
  const mutateAsync = isV2 ? v2MutateAsync : v1MutateAsync;
  const isPending = isV2 ? v2IsPending : v1IsPending;
  const addLiquidityError = isV2 ? v2Error : v1Error;

  const firstAssetAmountString = firstAssetAmount.formatUnits(
    firstAssetMetadata.decimals
  );
  const secondAssetAmountString = secondAssetAmount.formatUnits(
    secondAssetMetadata.decimals
  );

  const handleAddLiquidity = useCallback(async () => {
    try {
      const data = await mutateAsync();
      if (data?.id) {
        openSuccessModal();
      }
    } catch (e) {
      console.error(e);
      openFailureModal();
    }
  }, [mutateAsync, openFailureModal, openSuccessModal]);

  const onFailureModalClose = useCallback(() => {
    setPreviewData(null);
  }, [setPreviewData]);

  const redirectToLiquidity = useCallback(() => {
    router.push("/liquidity");
  }, [router]);

  const feeText = isStablePool ? "0.05%" : "0.3%";
  const uiPoolType = isV2
    ? "v2-concentrated"
    : mapUiPoolTypeFromStableFlag(isStablePool);

  return (
    <>
      <>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <CoinPair
              firstCoin={assets[0].assetId}
              secondCoin={assets[1].assetId}
              isStablePool={isStablePool}
              poolType={uiPoolType}
              withPoolDetails
            />
            {isV2 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  Concentrated Liquidity
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 p-3 rounded-md bg-background-secondary">
            <div className="flex justify-between items-center">
              <Coin assetId={assets[0].assetId} />
              <p className="text-sm  leading-4">{firstAssetAmountString}</p>
            </div>
            <div className="flex justify-between items-center">
              <Coin assetId={assets[1].assetId} />
              <p className="text-sm  leading-4">{secondAssetAmountString}</p>
            </div>
            <div className="flex justify-between items-center border-t border-background-grey-dark pt-3">
              <p className="text-sm  leading-4">Fee tier</p>
              <p className="text-sm  leading-4">{feeText}</p>
            </div>

            {/* V2 specific information */}
            {isV2 && (
              <>
                <div className="flex justify-between items-center border-t border-background-grey-dark pt-3">
                  <p className="text-sm leading-4">Strategy</p>
                  <p className="text-sm leading-4 capitalize">
                    {previewData.binStrategy}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm leading-4">Number of bins</p>
                  <p className="text-sm leading-4">{previewData.numBins}</p>
                </div>
                {previewData.priceRange && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm leading-4">Price range</p>
                    <p className="text-sm leading-4">
                      {previewData.priceRange[0].toFixed(4)} -{" "}
                      {previewData.priceRange[1].toFixed(4)}
                    </p>
                  </div>
                )}
                {previewData.isMock && (
                  <div className="flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      Mock Mode
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Testing without contracts
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <Button disabled={isPending} onClick={handleAddLiquidity}>
          Add Liquidity
        </Button>

        <SuccessModal title={<></>} onClose={redirectToLiquidity}>
          <AddLiquiditySuccessModal
            coinA={firstAssetMetadata.symbol || null}
            coinB={secondAssetMetadata.symbol || null}
            firstCoinAmount={firstAssetAmountString}
            secondCoinAmount={secondAssetAmountString}
            transactionHash={data?.id}
          />
        </SuccessModal>

        <FailureModal title={<></>} onClose={onFailureModalClose}>
          <TransactionFailureModal
            error={addLiquidityError}
            closeModal={closeFailureModal}
          />
        </FailureModal>
      </>
    </>
  );
}
