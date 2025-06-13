import React from "react";
import clsx from "clsx";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import usePoolAPR from "@/src/hooks/usePoolAPR";
import {PoolId} from "mira-dex-ts";
import {createPoolKey, formatAprValue} from "@/src/utils/common";
import usePoolNameAndMatch from "@/src/hooks/usePoolNameAndMatch";

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
        <div className="flex items-center">
          <p className="text-base font-bold leading-[19px]">APR&nbsp;</p>
          <AprBadge
            aprValue={aprValue}
            poolKey={poolKey}
            tvlValue={tvlValue}
            small
          />
        </div>
      ) : (
        <p className="text-base font-bold leading-[19px]">
          APR&nbsp;
          <span
            className={clsx(
              "text-[var(--content-dimmed-light)]",
              !aprValue && "blur-[2px]",
            )}
          >
            {aprValue ?? "33.33%"}
          </span>
        </p>
      )}
    </>
  );
};

export default AprDisplay;
