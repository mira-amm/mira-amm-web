import React from "react";
import clsx from "clsx";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import styles from "./AprDisplay.module.css";
import usePoolAPR from "@/src/hooks/usePoolAPR";
import {PoolId} from "mira-dex-ts";
import {createPoolKey} from "@/src/utils/common";
import usePoolNameAndMatch from "@/src/hooks/usePoolNameAndMatch";
import {formatAprValue} from "@/src/utils/common";

interface AprDiplayProps {
  pool: PoolId;
}

const AprDisplay = ({pool}: AprDiplayProps) => {
  const {apr} = usePoolAPR(pool);
  const aprValue = formatAprValue(apr);

  const tvlValue = apr?.tvlUSD;
  const poolKey = createPoolKey(pool);
  const {isMatching} = usePoolNameAndMatch(poolKey);

  return (
    <>
      {isMatching ? (
        <div className={styles.aprBadge}>
          <p className={clsx("mc-type-m")}>APR &nbsp;</p>
          <AprBadge
            aprValue={aprValue}
            poolKey={poolKey}
            tvlValue={tvlValue}
            small
          />
        </div>
      ) : (
        <p>
          APR &nbsp;
          <span className={clsx(!aprValue && "blurredText", "mc-mono-m")}>
            {aprValue ?? "Awaiting data"}
          </span>
        </p>
      )}
    </>
  );
};

export default AprDisplay;
