import {memo} from "react";
import {PoolId} from "mira-dex-ts";
import {useAssetImage} from "@/src/hooks";
import Image from "next/image";

export const SwapRouteItem = memo(function SwapRouteItem({pool}: {pool: PoolId}) {
  const firstAssetIcon = useAssetImage(pool[0].bits);
  const secondAssetIcon = useAssetImage(pool[1].bits);
  const fee = pool[2] ? 0.05 : 0.3;

  return (
    <div className="flex items-center gap-1">
      <Image
        alt={`Asset Icon (${pool[0].bits})`}
        src={firstAssetIcon || ""}
        className="-mr-2 h-4 w-4"
        width={16}
        height={16}
      />
      <Image
        alt={`Asset Icon (${pool[1].bits})`}
        src={secondAssetIcon || ""}
        className="h-4 w-4"
        width={16}
        height={16}
      />
      <p className="text-sm">({fee}%)</p>
    </div>
  );
});
