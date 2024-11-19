import styles from "./DesktopPools.module.css";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import {useCallback} from "react";
import DesktopPoolRow from "./DesktopPoolRow";

type Props = {
  poolsData: PoolData[] | undefined;
};

const DesktopPools = ({ poolsData }: Props) => {
  const router = useRouter();

  if (!poolsData) {
    return null;
  }

  return (
    <table className={clsx(styles.desktopPools, "desktopOnly")}>
      <thead>
        <tr>
          <th>Pools</th>
          <th>APR</th>
          <th>24H Volume</th>
          <th>TVL</th>
          <th>
            {/*<ActionButton*/}
            {/*className={styles.createButton}*/}
            {/*onClick={handleCreateClick}*/}
            {/*>*/}
            {/*Create Pool*/}
            {/*</ActionButton>*/}
          </th>
        </tr>
      </thead>
      <tbody>
        {poolsData.map((poolData) => (
          <DesktopPoolRow key={poolData.id} poolData={poolData} />
        ))}
      </tbody>
    </table>
  );
};

export default DesktopPools;
