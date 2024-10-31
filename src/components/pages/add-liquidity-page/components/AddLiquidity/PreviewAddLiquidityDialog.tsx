import styles from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import Coin from "@/src/components/common/Coin/Coin";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import useAddLiquidity from "@/src/hooks/useAddLiquidity";
import useModal from "@/src/hooks/useModal/useModal";
import AddLiquiditySuccessModal
  from "@/src/components/pages/add-liquidity-page/components/AddLiquiditySuccessModal/AddLiquiditySuccessModal";
import {useRouter} from "next/navigation";
import {Dispatch, SetStateAction, useCallback} from "react";
import TransactionFailureModal from "@/src/components/common/TransactionFailureModal/TransactionFailureModal";
import {BN} from "fuels";

type AssetsData = {
  coin: CoinName;
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
}

const PreviewAddLiquidityDialog = ({ previewData, setPreviewData }: Props) => {
  const [SuccessModal, openSuccessModal] = useModal();
  const [FailureModal, openFailureModal, closeFailureModal] = useModal();

  const router = useRouter();

  const { assets, isStablePool } = previewData;

  const firstAssetName = assets[0].coin;
  const secondAssetName = assets[1].coin;
  const firstAssetAmount = assets[0].amount;
  const secondAssetAmount = assets[1].amount;

  const { data, mutateAsync, isPending, error: addLiquidityError } = useAddLiquidity({
    firstAsset: previewData.assets[0].assetId,
    firstAssetAmount,
    secondAsset: previewData.assets[1].assetId,
    secondAssetAmount,
    isPoolStable: isStablePool,
  });

  const firstAssetDecimals = coinsConfig.get(firstAssetName)?.decimals!;
  const secondAssetDecimals = coinsConfig.get(secondAssetName)?.decimals!;
  const firstAssetAmountString = firstAssetAmount.formatUnits(firstAssetDecimals);
  const secondAssetAmountString = secondAssetAmount.formatUnits(secondAssetDecimals);

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
    router.push('/liquidity');
  }, [router]);

  const feeText = isStablePool ? '0.05%' : '0.3%';

  return (
    <>
      <div className={styles.section}>
        <div className={styles.previewCoinPair}>
          <CoinPair firstCoin={firstAssetName} secondCoin={secondAssetName} isStablePool={isStablePool}/>
        </div>
        <div className={styles.inputsPreview}>
          <div className={styles.inputPreviewRow}>
            <Coin name={firstAssetName} />
            <p>{firstAssetAmountString}</p>
          </div>
          <div className={styles.inputPreviewRow}>
            <Coin name={secondAssetName} />
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
          coinA={firstAssetName}
          coinB={secondAssetName}
          firstCoinAmount={firstAssetAmountString}
          secondCoinAmount={secondAssetAmountString}
          transactionHash={data?.id}
        />
      </SuccessModal>
      <FailureModal title={<></>} onClose={onFailureModalClose}>
        <TransactionFailureModal error={addLiquidityError} closeModal={closeFailureModal} />
      </FailureModal>
    </>
  );
};

export default PreviewAddLiquidityDialog;
