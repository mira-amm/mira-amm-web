import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {Coin, TransactionFailureModal} from "@/src/components/common";
import {useAddLiquidity, useModal, useAssetMetadata} from "@/src/hooks";
import AddLiquiditySuccessModal from "@/src/components/pages/add-liquidity-page/components/AddLiquiditySuccessModal/AddLiquiditySuccessModal";
import {useRouter} from "next/navigation";
import {Dispatch, SetStateAction, useCallback} from "react";
import {BN} from "fuels";
import {Button} from "@/meshwave-ui/Button";

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

  const {assets, isStablePool} = previewData;

  const firstAssetMetadata = useAssetMetadata(assets[0].assetId);
  const secondAssetMetadata = useAssetMetadata(assets[1].assetId);

  const firstAssetAmount = assets[0].amount;
  const secondAssetAmount = assets[1].amount;

  const {
    data,
    mutateAsync,
    isPending,
    error: addLiquidityError,
  } = useAddLiquidity({
    firstAsset: previewData.assets[0].assetId,
    firstAssetAmount,
    secondAsset: previewData.assets[1].assetId,
    secondAssetAmount,
    isPoolStable: isStablePool,
    slippage,
  });

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
  const isV2 = previewData.type === "v2-concentrated";

  return (
    <>
      <>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <CoinPair
              firstCoin={assets[0].assetId}
              secondCoin={assets[1].assetId}
              isStablePool={isStablePool}
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

        <Button loading={isPending} onClick={handleAddLiquidity}>
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
