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
          </div>
          <div className="flex flex-col gap-3 p-3 rounded-md bg-background-secondary">
            <div className="flex justify-between items-center">
              <Coin assetId={assets[0].assetId} />
              <p className="text-sm font-medium leading-4">
                {firstAssetAmountString}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <Coin assetId={assets[1].assetId} />
              <p className="text-sm font-medium leading-4">
                {secondAssetAmountString}
              </p>
            </div>
            <div className="flex justify-between items-center border-t border-background-grey-dark pt-3">
              <p className="text-sm font-medium leading-4">Fee tier</p>
              <p className="text-sm font-medium leading-4">{feeText}</p>
            </div>
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
