import styles from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import Coin from "@/src/components/common/Coin/Coin";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import useAddLiquidity from "@/src/hooks/useAddLiquidity";
import useModal from "@/src/hooks/useModal/useModal";
import AddLiquiditySuccessModal from "@/src/components/pages/add-liquidity-page/components/AddLiquiditySuccessModal/AddLiquiditySuccessModal";
import {useRouter} from "next/navigation";
import {Dispatch, SetStateAction, useCallback} from "react";
import TransactionFailureModal from "@/src/components/common/TransactionFailureModal/TransactionFailureModal";
import {BN} from "fuels";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";

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

  return (
    <>
      <div className={styles.section}>
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
          <div className={styles.inputPreviewRow}>
            <p>Fee tier</p>
            <p>{feeText}</p>
          </div>
        </div>
      </div>
      {/* <div className={styles.section}>
        <p>Selected Price</p>
        <div className={styles.sectionContent}>
          <div className={styles.previewPriceBlocks}>
            <div className={styles.previewPriceBlock}>
              <p className={styles.previewPriceBlockTitle}>
                Low price
              </p>
              <p className={styles.previewPriceBlockValue}>
                0
              </p>
              <p className={styles.previewPriceBlockExchange}>
                {coinA} per {coinB}
              </p>
              <p className={styles.previewPriceBlockDescription}>
                Your position will be 100% composed of {coinA} at this price
              </p>
            </div>
            <div className={styles.previewPriceBlock}>
              <p className={styles.previewPriceBlockTitle}>
                High price
              </p>
              <p className={styles.previewPriceBlockValue}>
                ∞
              </p>
              <p className={styles.previewPriceBlockExchange}>
                {coinA} per {coinB}
              </p>
              <p className={styles.previewPriceBlockDescription}>
                Your position will be 100% composed of {coinB} at this price
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.previewCurrentPriceBlock}>
          <p className={styles.previewPriceBlockTitle}>
            Current Price
          </p>
          <p className={styles.previewPriceBlockValue}>
            {rate}
          </p>
          <p className={styles.previewPriceBlockExchange}>
            {coinA} per {coinB}
          </p>
        </div>
      </div> */}
      <ActionButton loading={isPending} onClick={handleAddLiquidity}>
        Add Liquidity
      </ActionButton>
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
  );
};

export default PreviewAddLiquidityDialog;
