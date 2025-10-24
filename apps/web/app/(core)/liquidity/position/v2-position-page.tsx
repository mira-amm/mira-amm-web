"use client";

import {V2PositionView} from "@/src/components/pages/view-position-page/components/PositionView/v2-position-view";
import {BN} from "fuels";
import {useMemo} from "react";

export default function V2PositionPage({
  poolKey,
  unifiedPoolIdString,
}: {
  poolKey?: string;
  unifiedPoolIdString: string;
}) {
  // Deserialize the unifiedPoolId from string back to BN on the client side
  const unifiedPoolId = useMemo(() => {
    return new BN(unifiedPoolIdString);
  }, [unifiedPoolIdString]);

  return (
    <main className="flex flex-col gap-4 mx-auto lg:w-[716px] w-full lg:px-4 lg:py-8">
      <V2PositionView poolKey={poolKey} unifiedPoolId={unifiedPoolId} />
    </main>
  );
}
