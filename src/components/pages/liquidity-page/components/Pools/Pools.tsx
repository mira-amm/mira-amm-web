import MobilePools from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePools";
import DesktopPools from "@/src/components/pages/liquidity-page/components/Pools/DesktopPools/DesktopPools";

import styles from "./Pools.module.css";
import usePoolsData from "@/src/hooks/usePoolsData";
import LoaderIcon from "@/src/components/icons/Loader/LoaderIcon";
import LoaderV2 from "@/src/components/common/LoaderV2/LoaderV2";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import clsx from "clsx";

const Pools = () => {
  const { data, isPending } = usePoolsData();

  return (
    <section className={styles.pools}>
      <div className={styles.poolsHeader}>
        <p className={styles.poolsTitle}>All Pools</p>
        <ActionButton className={clsx("mobileOnly", styles.addButton)} onClick={() => {}}>
          Create a pool
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
