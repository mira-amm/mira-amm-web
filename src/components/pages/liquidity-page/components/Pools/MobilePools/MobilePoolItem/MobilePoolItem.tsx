import {usePoolDetails} from "../../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import InfoBlock from "@/src/components/common/InfoBlock/InfoBlock";
import {useRouter} from "next/navigation";
import styles from "./MobilePoolItem.module.css";
import {PoolData} from "@/src/hooks/usePoolsData";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import usePoolNameAndMatch from "@/src/hooks/usePoolNameAndMatch";

type Props = {
  poolData: PoolData;
};

const MobilePoolItem = ({poolData}: Props): JSX.Element => {
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
  const tvlActual = tvlValue
    ? parseInt(tvlValue?.replace(/[^0-9]+/g, ""), 10)
    : 0;

  //Checks if the pool with rewards matches the current pool
  const {isMatching} = usePoolNameAndMatch(poolKey);

  return (
    <div className={styles.mobilePoolItem}>
      <div className={styles.infoSection}>
        <CoinPair
          firstCoin={poolId[0].bits}
          secondCoin={poolId[1].bits}
          isStablePool={isStablePool}
        />
        <div className={styles.infoBlocks}>
          {isMatching ? (
            <div>
              <p>{"APR"}</p>
              <AprBadge
                small={true}
                aprValue={aprValue}
                poolKey={poolKey || ""}
                tvlValue={tvlActual}
              />
            </div>
          ) : (
            <InfoBlock title="APR" value={aprValue} type="positive" />
          )}

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
