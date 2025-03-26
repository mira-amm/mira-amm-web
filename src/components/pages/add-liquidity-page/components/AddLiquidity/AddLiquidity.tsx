import styles from "./AddLiquidity.module.css";
import {useCallback, useState} from "react";
import PreviewAddLiquidityDialog, {
  AddLiquidityPreviewData,
} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";
import AddLiquidityDialog from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidityDialog";
import BackLink from "@/src/components/common/BackLink/BackLink";
import {useRouter} from "next/navigation";
import IconButton from "@/src/components/common/IconButton/IconButton";
import CloseIcon from "@/src/components/icons/Close/CloseIcon";
import {PoolId} from "mira-dex-ts";
import {DefaultSlippageValue} from "@/src/components/common/Swap/Swap";
import clsx from "clsx";

type Props = {
  poolId: PoolId;
  poolKey: string;
};

const AddLiquidity = ({poolId, poolKey}: Props): JSX.Element => {
  const router = useRouter();

  const [previewData, setPreviewData] =
    useState<AddLiquidityPreviewData | null>(null);

  const handleBackClick = useCallback(() => {
    if (previewData) {
      setPreviewData(null);
    } else {
      router.back();
    }
  }, [previewData, router]);

  const handleCloseClick = useCallback(() => {
    router.push("/liquidity");
  }, [router]);

  const showPreview = Boolean(previewData);

  return (
    <>
      <BackLink
        showOnDesktop
        onClick={handleBackClick}
        className={styles.backLink}
        title="Back"
      />
      <section className={clsx("liquidity-action-container")}>
        <div className={styles.addLiquidityHeading}>
          <p className={clsx(styles.title, "mc-type-xl")}>Add Liquidity</p>
          {showPreview && (
            <IconButton onClick={handleCloseClick}>
              <CloseIcon />
            </IconButton>
          )}
        </div>
        {showPreview ? (
          <PreviewAddLiquidityDialog
            previewData={previewData!}
            setPreviewData={setPreviewData}
            slippage={DefaultSlippageValue}
          />
        ) : (
          <AddLiquidityDialog
            poolId={poolId}
            setPreviewData={setPreviewData}
            poolKey={poolKey}
          />
        )}
      </section>
    </>
  );
};

export default AddLiquidity;
