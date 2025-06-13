import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {Coin} from "@/src/components/common";
import {useModal} from "@/src/hooks";
import CreatePoolSuccessModal from "../CreatePoolSuccessModal/CreatePoolSuccessModal";
import {useRouter} from "next/navigation";
import {useCallback} from "react";
import useCreatePool from "@/src/hooks/useCreatePool";
import {useAssetMetadata} from "@/src/hooks";
import {Button} from "@/meshwave-ui/Button";

type AssetsData = {
  assetId: string;
  amount: string;
};

export type CreatePoolPreviewData = {
  assets: AssetsData[];
  isStablePool: boolean;
};

type Props = {
  previewData: CreatePoolPreviewData;
};

const PreviewCreatePoolDialog = ({previewData}: Props) => {
  const [SuccessModal, openSuccessModal, closeSuccessModal] = useModal();
  const firstAssetMetadata = useAssetMetadata(previewData.assets[0].assetId);
  const secondAssetMetadata = useAssetMetadata(previewData.assets[1].assetId);

  const router = useRouter();

  const {assets, isStablePool} = previewData;

  const {createPoolData, createPool, isPoolCreationPending} = useCreatePool({
    firstAsset: assets[0].assetId,
    firstAssetAmount: assets[0].amount,
    secondAsset: assets[1].assetId,
    secondAssetAmount: assets[1].amount,
    isPoolStable: isStablePool,
  });

  const firstCoinAmount = previewData.assets[0].amount;
  const secondCoinAmount = previewData.assets[1].amount;

  const handleCreateLiquidity = useCallback(async () => {
    const data = await createPool();

    if (data?.id) {
      openSuccessModal();
    }
  }, [createPool, openSuccessModal]);

  const redirectToLiquidity = useCallback(() => {
    router.push("/liquidity");
  }, [router]);

  const feeText = isStablePool ? "0.05%" : "0.3%";

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <CoinPair
            firstCoin={previewData.assets[0].assetId}
            secondCoin={previewData.assets[1].assetId}
            isStablePool={isStablePool}
          />
        </div>
        <div className="flex flex-col gap-3 bg-[var(--background-secondary)] p-3 rounded-md">
          <div className="flex justify-between items-center">
            <Coin assetId={previewData.assets[0].assetId} />
            <p className="text-sm font-medium leading-4">{firstCoinAmount}</p>
          </div>
          <div className="flex justify-between items-center">
            <Coin assetId={previewData.assets[1].assetId} />
            <p className="text-sm font-medium leading-4">{secondCoinAmount}</p>
          </div>
          <div className="flex justify-between items-center border-t border-[var(--background-grey-dark)] pt-3">
            <p className="text-sm font-medium leading-4">Fee tier</p>
            <p className="text-sm font-medium leading-4">{feeText}</p>
          </div>
        </div>
      </div>

      <Button loading={isPoolCreationPending} onClick={handleCreateLiquidity}>
        Create pool
      </Button>

      <SuccessModal title={<></>} onClose={redirectToLiquidity}>
        <CreatePoolSuccessModal
          coinA={firstAssetMetadata.symbol || null}
          coinB={secondAssetMetadata.symbol || null}
          firstCoinAmount={firstCoinAmount}
          secondCoinAmount={secondCoinAmount}
          transactionHash={createPoolData?.id}
        />
      </SuccessModal>
    </>
  );
};

export default PreviewCreatePoolDialog;
