import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import InfoBlock from "@/src/components/common/InfoBlock/InfoBlock";

import styles from './MobilePoolItem.module.css';
import {useRouter} from "next/navigation";
import {createPoolIdFromIdString, createPoolKey, getAssetNamesFromPoolId} from "@/src/utils/common";
import {PoolData} from "@/src/hooks/usePoolsData";
import {useCallback} from "react";
import {DefaultLocale} from "@/src/utils/constants";

type Props = {
  poolData: PoolData;
}

const MobilePoolItem = ({ poolData }: Props) => {
  const router = useRouter();

  const poolId = createPoolIdFromIdString(poolData.id);
  const poolKey = createPoolKey(poolId);

  const handleAddClick = useCallback(() => {
    router.push(`/liquidity/add?pool=${poolKey}`);
  }, [router, poolKey]);

  const { firstAssetName, secondAssetName } = getAssetNamesFromPoolId(poolId);

  let aprValue = 'n/a';
  let volumeValue = 'n/a';
  let tvlValue = 'n/a';

  if (poolData.details) {
    const {details: {apr, volume, tvl}} = poolData;

    if (apr) {
      aprValue =`${parseFloat(apr).toLocaleString(DefaultLocale, {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`;
    }
    volumeValue = `$${parseFloat(volume).toLocaleString(DefaultLocale, {maximumFractionDigits: 0})}`;
    tvlValue = `$${parseFloat(tvl).toLocaleString(DefaultLocale, {maximumFractionDigits: 0})}`;
  }

  const isStablePool = poolId[2];
  const feeText = isStablePool ? '0.05%' : '0.3%';
  const poolDescription = `${isStablePool ? 'Stable' : 'Volatile'}: ${feeText}`;

  return (
    <div className={styles.mobilePoolItem}>
      <div className={styles.infoSection}>
        <CoinPair firstCoin={firstAssetName} secondCoin={secondAssetName} isStablePool={isStablePool} />
        <div className={styles.infoBlocks}>
          <InfoBlock title="APR" value={aprValue} type="positive"/>
          <InfoBlock title="24H Volume" value={volumeValue}/>
          <InfoBlock title="TVL" value={tvlValue}/>
        </div>
        <p className={styles.poolDescription}>{poolDescription}</p>
      </div>
      <ActionButton className={styles.addButton} variant="secondary" onClick={handleAddClick} fullWidth>
        Add Liquidity
      </ActionButton>
    </div>
  );
};

export default MobilePoolItem;
