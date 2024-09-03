import {isMobile} from "react-device-detect";

import MobilePoolItem
  from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePoolItem/MobilePoolItem";

import styles from './MobilePools.module.css';
import {PoolInfoOutput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";
import {useRouter} from "next/navigation";

type Props = {
  poolsData: ({ key: string, value: PoolInfoOutput } | null)[] | undefined;
}

const MobilePools = ({ poolsData }: Props) => {
  if (!isMobile) {
    return null;
  }

  if (!poolsData) {
    return null;
  }

  return (
    <div className={styles.mobilePools}>
      {poolsData.map(poolData => {
        if (!poolData) {
          return null;
        }

        const { key } = poolData;

        return (
          <>
            <MobilePoolItem poolKey={key} key={key}/>
            {poolsData.indexOf(poolData) !== poolsData.length - 1 && <div className={styles.separator}/>}
          </>
        );
      })}
    </div>
  );
};

export default MobilePools;
