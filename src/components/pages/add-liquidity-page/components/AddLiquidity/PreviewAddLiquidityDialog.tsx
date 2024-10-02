import styles from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import Coin from "@/src/components/common/Coin/Coin";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {CoinName} from "@/src/utils/coinsConfig";
import useAddLiquidity from "@/src/hooks/useAddLiquidity";
import useModal from "@/src/hooks/useModal/useModal";
import AddLiquiditySuccessModal
  from "@/src/components/pages/add-liquidity-page/components/AddLiquiditySuccessModal/AddLiquiditySuccessModal";
import {useRouter} from "next/navigation";
import {useCallback} from "react";
import {DefaultLocale} from "@/src/utils/constants";

type AssetsData = {
  coin: CoinName;
  amount: string;
};

export type AddLiquidityPreviewData = {
  assets: AssetsData[];
  isStablePool: boolean;
};

type Props = {
  previewData: AddLiquidityPreviewData;
}

const PreviewAddLiquidityDialog = ({ previewData }: Props) => {
  const [SuccessModal, openSuccessModal, closeSuccessModal] = useModal();

  const router = useRouter();

  const { data, mutateAsync, isPending } = useAddLiquidity({
    firstAssetName: previewData.assets[0].coin,
    firstAssetAmount: previewData.assets[0].amount,
    secondAssetName: previewData.assets[1].coin,
    secondAssetAmount: previewData.assets[1].amount,
    isPoolStable: previewData.isStablePool,
  });

  const coinA = previewData.assets[0].coin;
  const coinB = previewData.assets[1].coin;
  const firstCoinAmount = previewData.assets[0].amount;
  const secondCoinAmount = previewData.assets[1].amount;

  const rate = (
    parseFloat(firstCoinAmount) / parseFloat(secondCoinAmount)
  ).toLocaleString(DefaultLocale, { minimumFractionDigits: 2 });

  const handleAddLiquidity = async () => {
    const data = await mutateAsync();
    if (data?.id) {
      openSuccessModal();
    }
  };

  const redirectToLiquidity = useCallback(() => {
    router.push('/liquidity');
  }, [router]);

  return (
    <>
      <div className={styles.section}>
        <div className={styles.previewCoinPair}>
          <CoinPair firstCoin={coinA} secondCoin={coinB}/>
        </div>
        <div className={styles.inputsPreview}>
          <div className={styles.inputPreviewRow}>
            <Coin name={coinA} />
            <p>{firstCoinAmount}</p>
          </div>
          <div className={styles.inputPreviewRow}>
            <Coin name={coinB} />
            <p>{secondCoinAmount}</p>
          </div>
          <div className={styles.inputPreviewRow}>
            <p>Fee tier</p>
            <p>0.3%</p>
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
        <AddLiquiditySuccessModal coinA={coinA} coinB={coinB} firstCoinAmount={firstCoinAmount} secondCoinAmount={secondCoinAmount} transactionHash={data?.id} />
      </SuccessModal>
    </>
  );
};

export default PreviewAddLiquidityDialog;
