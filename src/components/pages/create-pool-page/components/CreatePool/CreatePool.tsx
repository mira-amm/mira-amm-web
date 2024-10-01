import styles from '../../../add-liquidity-page/components/AddLiquidity/AddLiquidity.module.css';
import {createPoolIdFromAssetNames, createPoolIdFromPoolKey, getCoinsFromKey} from "@/src/utils/common";
import {useCallback, useState} from "react";
import PreviewCreatePoolDialog
  , {
    CreatePoolPreviewData
} from "@/src/components/pages/create-pool-page/components/CreatePool/PreviewCreatePoolDialog";
import CreatePoolDialog from './CreatePoolDialog';
import BackLink from "@/src/components/common/BackLink/BackLink";
import {useRouter} from "next/navigation";
import IconButton from "@/src/components/common/IconButton/IconButton";
import CloseIcon from "@/src/components/icons/Close/CloseIcon";

type Props = {
  poolKey: string;
}

const CreatePool = ({ poolKey }: Props) => {
  const router = useRouter();

  const [previewData, setPreviewData] = useState<CreatePoolPreviewData | null>(null);

  const poolId = createPoolIdFromPoolKey(poolKey);

  const handleBackClick = useCallback(() => {
    if (previewData) {
      setPreviewData(null);
    } else {
      router.back();
    }
  }, [previewData, router]);

  const handleCloseClick = useCallback(() => {
    router.push('/liquidity');
  }, [router]);

  const showPreview = Boolean(previewData);

  return (
    <>
      <BackLink showOnDesktop onClick={handleBackClick} className={styles.backLink} />
      <section className={styles.addLiquidity}>
        <div className={styles.addLiquidityHeading}>
          <p className={styles.title}>
            Create Pool
          </p>
          {showPreview && (
            <IconButton onClick={handleCloseClick}>
              <CloseIcon />
            </IconButton>
          )}
        </div>
        {showPreview ? (
          <PreviewCreatePoolDialog previewData={previewData!} />
        ) : (
          <CreatePoolDialog poolId={poolId} setPreviewData={setPreviewData} />
        )}
      </section>
      {showPreview && (
        <div className={styles.loadingOverlay}/>
      )}
    </>
  );
};

export default CreatePool;