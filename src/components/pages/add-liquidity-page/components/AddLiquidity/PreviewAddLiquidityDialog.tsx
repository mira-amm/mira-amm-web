import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import Coin from "@/src/components/common/Coin/Coin";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import StatusModal, {ModalType} from "@/src/components/common/StatusModal";
import styles from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity.module.css";
import useAddLiquidity from "@/src/hooks/useAddLiquidity";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import useModal from "@/src/hooks/useModal/useModal";
import {BN, FuelError} from "fuels";
import {useRouter} from "next/navigation";
import {Dispatch, SetStateAction, useCallback, useMemo} from "react";

type AssetsData = {
  assetId: string;
  amount: BN;
};

export type AddLiquidityPreviewData = {
  assets: AssetsData[];
  isStablePool: boolean;
};

type Props = {
  previewData: AddLiquidityPreviewData;
  setPreviewData: Dispatch<SetStateAction<AddLiquidityPreviewData | null>>;
  slippage: number;
};

const PreviewAddLiquidityDialog = ({
  previewData,
  setPreviewData,
  slippage,
}: Props) => {
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
    firstAssetMetadata.decimals,
  );
  const secondAssetAmountString = secondAssetAmount.formatUnits(
    secondAssetMetadata.decimals,
  );

  // const rate = (
  //   parseFloat(firstCoinAmount) / parseFloat(secondCoinAmount)
  // ).toLocaleString(DefaultLocale, { minimumFractionDigits: 2 });

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

  const calculateMessages = () => {
    const successMessage = `Added ${firstAssetAmountString} ${firstAssetMetadata.symbol} and ${secondAssetAmountString} ${secondAssetMetadata.symbol}`;

    let errorMessage: string;
    if (addLiquidityError instanceof FuelError) {
      errorMessage = addLiquidityError.message;
    } else {
      errorMessage =
        "An error occurred while processing your request. Please try again or contact support if the issue persists.";
    }

    return [successMessage, errorMessage];
  };

  const [successModalSubtitle, errorModalSubtitle] = calculateMessages();

  return (
    <>
      <div className={styles.previewContent}>
        <div className={styles.previewCoinPair}>
          <CoinPair
            firstCoin={assets[0].assetId}
            secondCoin={assets[1].assetId}
            isStablePool={isStablePool}
          />
        </div>
        <div className={styles.inputsPreview}>
          <div className={styles.inputPreviewRow}>
            <Coin assetId={assets[0].assetId} />
            <p>{firstAssetAmountString}</p>
          </div>
          <div className={styles.inputPreviewRow}>
            <Coin assetId={assets[1].assetId} />
            <p>{secondAssetAmountString}</p>
          </div>
          <hr className={styles.divider} />
          <div className={styles.inputPreviewRow}>
            <p>Fee tier</p>
            <p>{feeText}</p>
          </div>
        </div>
      </div>
      <ActionButton loading={isPending} onClick={handleAddLiquidity}>
        Add liquidity
      </ActionButton>
      <SuccessModal title={<></>} onClose={redirectToLiquidity}>
        <StatusModal
          type={ModalType.SUCCESS}
          title="Liquidity added successfully"
          subTitle={successModalSubtitle}
          transactionHash={data?.id}
        />
      </SuccessModal>
      <FailureModal title={<></>} onClose={onFailureModalClose}>
        <StatusModal
          type={ModalType.ERROR}
          title="Failed to add liquidity"
          subTitle={errorModalSubtitle}
        />
      </FailureModal>
    </>
  );
};

export default PreviewAddLiquidityDialog;
