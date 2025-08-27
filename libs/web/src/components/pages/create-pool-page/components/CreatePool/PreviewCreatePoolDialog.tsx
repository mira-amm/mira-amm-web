import {useCallback} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/meshwave-ui/Button";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {Coin} from "@/src/components/common";
import {
  useCreatePool,
  useCreatePoolV2,
  useModal,
  useAssetMetadata,
} from "@/src/hooks";
import CreatePoolSuccessModal from "../CreatePoolSuccessModal/CreatePoolSuccessModal";

export type CreatePoolPreviewData = {
  assets: {
    assetId: string;
    amount: string;
  }[];
  poolType: "volatile" | "stable" | "concentrated";
  v2Config?: {
    binStep: number;
    baseFactor: number;
  };
};

const PreviewCreatePoolDialog = ({
  previewData,
}: {
  previewData: CreatePoolPreviewData;
}) => {
  const [SuccessModal, openSuccessModal, closeSuccessModal] = useModal();
  const firstAssetMetadata = useAssetMetadata(previewData.assets[0].assetId);
  const secondAssetMetadata = useAssetMetadata(previewData.assets[1].assetId);

  const router = useRouter();

  const {assets, poolType, v2Config} = previewData;

  // Use v1 hook for volatile and stable pools
  const v1Hook = useCreatePool({
    firstAsset: assets[0].assetId,
    firstAssetAmount: assets[0].amount,
    secondAsset: assets[1].assetId,
    secondAssetAmount: assets[1].amount,
    isPoolStable: poolType === "stable",
  });

  // Use v2 hook for concentrated liquidity pools
  const v2Hook = useCreatePoolV2({
    firstAsset: assets[0].assetId,
    firstAssetAmount: assets[0].amount,
    secondAsset: assets[1].assetId,
    secondAssetAmount: assets[1].amount,
    binStep: v2Config?.binStep || 25,
    baseFactor: v2Config?.baseFactor || 10000,
  });

  // Select the appropriate hook based on pool type
  const {createPoolData, createPool, isPoolCreationPending} =
    poolType === "concentrated" ? v2Hook : v1Hook;

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
            isStablePool={poolType === "stable"}
          />
        </div>
        <div className="flex flex-col gap-3 bg-[var(--background-secondary)] p-3 rounded-md">
          <div className="flex justify-between items-center">
            <Coin assetId={previewData.assets[0].assetId} />
            <p className="text-sm  leading-4">{firstCoinAmount}</p>
          </div>
          <div className="flex justify-between items-center">
            <Coin assetId={previewData.assets[1].assetId} />
            <p className="text-sm  leading-4">{secondCoinAmount}</p>
          </div>
          <div className="flex justify-between items-center border-t border-[var(--background-grey-dark)] pt-3">
            <p className="text-sm  leading-4">Fee tier</p>
            <p className="text-sm  leading-4">{feeText}</p>
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
