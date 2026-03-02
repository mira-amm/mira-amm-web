import {memo} from "react";
import {PoolId} from "mira-dex-ts";
import {BN} from "fuels";
import {useAssetImage} from "@/src/hooks";
import Image from "next/image";

function isPoolId(pool: PoolId | BN): pool is PoolId {
  return Array.isArray(pool);
}

export const SwapRouteItem = memo(function SwapRouteItem({
  pool,
}: {
  pool: PoolId | BN;
}) {
  const v1Pool = isPoolId(pool) ? pool : null;
  const firstAssetIcon = useAssetImage(v1Pool ? v1Pool[0].bits : "");
  const secondAssetIcon = useAssetImage(v1Pool ? v1Pool[1].bits : "");
  const fee = v1Pool ? (v1Pool[2] ? 0.05 : 0.3) : 0.3;

  return (
    <div className="flex items-center gap-1">
      <Image
        alt={`Asset Icon (${v1Pool ? v1Pool[0].bits : "v2"})`}
        src={firstAssetIcon || ""}
        className="-mr-2 h-4 w-4"
        width={16}
        height={16}
      />
      <Image
        alt={`Asset Icon (${v1Pool ? v1Pool[1].bits : "v2"})`}
        src={secondAssetIcon || ""}
        className="h-4 w-4"
        width={16}
        height={16}
      />
      <p className="text-sm">({fee}%)</p>
    </div>
  );
});
