import {usePoolDetails} from "../../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {ActionButton, InfoBlock} from "@/src/components/common";
import {useRouter} from "next/navigation";
import styles from "./MobilePoolItem.module.css";
import {PoolData} from "@/src/hooks/usePoolsData";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import usePoolNameAndMatch from "@/src/hooks/usePoolNameAndMatch";
import {Button} from "@/meshwave-ui/Button";

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
      <Button
        variant="secondary"
        onClick={handleAddClick}
        className="w-full bg-accent-dimmed text-accent-primary border-none shadow-none hover:bg-old-mira-bg-hover active:bg-old-mira-bg-active cursor-pointer"
      >
        Add Liquidity
      </Button>
    </div>
  );
};

export default MobilePoolItem;
