import BackLink from "@/src/components/common/BackLink/BackLink";
import {AddLiquidityPreviewData} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";
import {PoolId} from "mira-dex-ts";
import {useRouter} from "next/navigation";
import {useCallback, useState} from "react";
import styles from "./RemoveLiquidity.module.css";
import RemoveLiquidityContent from "../RemoveLiquidityContent";
import clsx from "clsx";

type Props = {
  poolId: PoolId;
};

const RemoveLiquidity = ({poolId}: Props): JSX.Element => {
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

  return (
    <>
      <BackLink showOnDesktop onClick={handleBackClick} title="Back" />
      <section className="liquidity-action-container">
        <div className={styles.removeLiquidityHeading}>
          <p className={clsx(styles.title, "mc-type-xl")}>Remove Liquidity</p>
        </div>
        <RemoveLiquidityContent pool={poolId} />
      </section>
    </>
  );
};

export default RemoveLiquidity;
