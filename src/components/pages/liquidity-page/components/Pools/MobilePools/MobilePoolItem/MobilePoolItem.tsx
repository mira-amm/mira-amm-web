import {usePoolDetails} from "../../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import InfoBlock from "@/src/components/common/InfoBlock/InfoBlock";
import {useRouter} from "next/navigation";
import styles from "./MobilePoolItem.module.css";
import {PoolData} from "@/src/hooks/usePoolsData";

type Props = {
  poolData: PoolData;
};

const MobilePoolItem = ({poolData}: Props) => {
  const router = useRouter();
  const {
    poolKey,
    aprValue,
    volumeValue,
    tvlValue,
    poolDescription,
    isStablePool,
    poolId,
  } = usePoolDetails(poolData);

  const handleAddClick = () => {
    router.push(`/liquidity/add?pool=${poolKey}`);
  };

  return (
    <div className={styles.mobilePoolItem}>
      <div className={styles.infoSection}>
        <CoinPair
          firstCoin={poolId[0].bits}
          secondCoin={poolId[1].bits}
          isStablePool={isStablePool}
        />
        <div className={styles.infoBlocks}>
          <InfoBlock
            title="APR"
            value={aprValue}
            type="positive"
            poolKey={poolKey}
          />
          <InfoBlock title="24H Volume" value={volumeValue} />
          <InfoBlock title="TVL" value={tvlValue} />
        </div>
        <p className={styles.poolDescription}>{poolDescription}</p>
      </div>
      <ActionButton
        className={styles.addButton}
        variant="secondary"
        onClick={handleAddClick}
        fullWidth
      >
        Add Liquidity
      </ActionButton>
    </div>
  );
};

export default MobilePoolItem;
