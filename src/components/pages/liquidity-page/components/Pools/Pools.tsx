import MobilePools from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePools";
import DesktopPools from "@/src/components/pages/liquidity-page/components/Pools/DesktopPools/DesktopPools";

import styles from "./Pools.module.css";
import usePoolsData from "@/src/hooks/usePoolsData";
import LoaderV2 from "@/src/components/common/LoaderV2/LoaderV2";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import {useCallback} from "react";

const Pools = () => {
  const { data, isPending } = usePoolsData();
  const router = useRouter();

  const handleCreatePoolClick = useCallback(() => {
    router.push('/liquidity/create-pool')
  }, [router]);

  return (
    <section className={styles.pools}>
      <div className={styles.poolsHeader}>
        <p className={styles.poolsTitle}>All Pools</p>
        <ActionButton className={clsx("mobileOnly", styles.createButton)} onClick={handleCreatePoolClick}>
         Create Pool
        </ActionButton>
      </div>
      <MobilePools poolsData={data} />
      <DesktopPools poolsData={data} />
      {isPending && (
        <div className={styles.loadingFallback}>
          <LoaderV2 />
          <p>Loading pools...</p>
        </div>
      )}
    </section>
  );
};

export default Pools;
