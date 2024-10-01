import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import InfoBlock from "@/src/components/common/InfoBlock/InfoBlock";

import styles from './MobilePoolItem.module.css';
import {useRouter} from "next/navigation";
import {createPoolIdFromIdString, createPoolKey, getCoinsFromKey, getAssetNamesFromPoolId} from "@/src/utils/common";
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
  const { details: { apr, volume, tvl } } = poolData;

  const aprValue = parseFloat(apr).toLocaleString(DefaultLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const volumeValue = parseFloat(volume).toLocaleString(DefaultLocale, { maximumFractionDigits: 0 });
  const tvlValue = parseFloat(tvl).toLocaleString(DefaultLocale, { maximumFractionDigits: 0 });

  return (
    <div className={styles.mobilePoolItem}>
      <div className={styles.infoSection}>
        <CoinPair firstCoin={firstAssetName} secondCoin={secondAssetName} />
        <div className={styles.infoBlocks}>
          <InfoBlock title="APR" value={`${aprValue}%`} type="positive" />
          <InfoBlock title="24H Volume" value={`$${volumeValue}`} />
          <InfoBlock title="TVL" value={`$${tvlValue}`} />
        </div>
      </div>
      <ActionButton className={styles.addButton} onClick={handleAddClick}>
        Add Liquidity
      </ActionButton>
    </div>
  );
};

export default MobilePoolItem;
