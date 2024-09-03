import styles from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";
import Coin from "@/src/components/common/Coin/Coin";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {CoinName} from "@/src/utils/coinsConfig";
import {BN} from "fuels";
import useAddLiquidity from "@/src/hooks/useAddLiquidity";

type AssetsData = {
  coin: CoinName;
  amount: string;
};

type PreviewData = {
  assets: AssetsData[];
  liquidityValue: BN | undefined;
};

type Props = {
  previewData: PreviewData;
}

const PreviewAddLiquidityDialog = ({ previewData }: Props) => {
  const { data, mutateAsync, isPending } = useAddLiquidity({
    firstCoin: previewData.assets[0].coin,
    firstCoinAmount: previewData.assets[0].amount,
    secondCoin: previewData.assets[1].coin,
    secondCoinAmount: previewData.assets[1].amount,
    liquidityAmount: previewData.liquidityValue,
  });

  const coinA = previewData.assets[0].coin;
  const coinB = previewData.assets[1].coin;
  const firstCoinAmount = previewData.assets[0].amount;
  const secondCoinAmount = previewData.assets[1].amount;

  const rate = (parseFloat(firstCoinAmount) / parseFloat(secondCoinAmount)).toFixed(2);

  const handleAddLiquidity = async () => {
    const data = await mutateAsync();
    console.log(data);
  };

  return (
    <>
      <div className={styles.section}>
        <div className={styles.previewCoinPair}>
          <CoinPair firstCoin={coinA} secondCoin={coinB}/>
          <PositionLabel />
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
            <p>0.05%</p>
          </div>
        </div>
      </div>
      <div className={styles.section}>
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
                The price at which the position will be 100% converted to {coinA}
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
                The price at which the position will be 100% converted to {coinB}
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
      </div>
      <ActionButton loading={isPending} onClick={handleAddLiquidity}>
        Add Liquidity
      </ActionButton>
    </>
  );
};

export default PreviewAddLiquidityDialog;
