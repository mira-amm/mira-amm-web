import styles from './AddLiquidity.module.css';
import {getCoinsFromKey} from "@/src/utils/common";
import {useState} from "react";
import PreviewAddLiquidityDialog
  from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";
import AddLiquidityDialog from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidityDialog";

type Props = {
  poolKey: string;
}

const AddLiquidity = ({ poolKey }: Props) => {
  const [previewData, setPreviewData] = useState(null);

  const { coinA, coinB } = getCoinsFromKey(poolKey);

  // const handlePreview = async () => {
  //   setIsPreviewOpen(true);
  // };

  return (
    <>
      <section className={styles.addLiquidity}>
        <p className={styles.title}>
          Add Liquidity
        </p>
        {previewData ? (
          <PreviewAddLiquidityDialog previewData={previewData} />
        ) : (
          <AddLiquidityDialog firstCoin={coinA} secondCoin={coinB} setPreviewData={setPreviewData} />
        )}
      </section>
      {previewData && <div className={styles.loadingOverlay}/>}
    </>
  );
};

export default AddLiquidity;
