import MobilePools from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePools";
import DesktopPools from "@/src/components/pages/liquidity-page/components/Pools/DesktopPools/DesktopPools";

import styles from './Pools.module.css';
import usePoolsData from "@/src/hooks/usePoolsData";
import LoaderIcon from "@/src/components/icons/Loader/LoaderIcon";
import LoaderV2 from "@/src/components/common/LoaderV2/LoaderV2";

const Pools = () => {
  const { data, isPending } = usePoolsData();

  return (
    <section className={styles.pools}>
      <p className={styles.poolsTitle}>
        All Pools
      </p>
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
