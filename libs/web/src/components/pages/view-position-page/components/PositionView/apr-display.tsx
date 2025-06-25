import React from "react";
import {PoolId} from "mira-dex-ts";
import clsx from "clsx";

import {createPoolKey, formatAprValue} from "@/src/utils/common";
import { AprBadge } from "@/src/components/common/AprBadge/AprBadge";
import { usePoolNameAndMatch } from "@/src/hooks/usePoolNameAndMatch";
import { usePoolAPR } from "@/src/hooks/usePoolAPR";

export function AprDisplay ({pool}: {
 pool: PoolId
}) {
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

