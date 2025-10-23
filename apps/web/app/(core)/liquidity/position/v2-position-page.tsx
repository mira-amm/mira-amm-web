"use client";

import {V2PositionView} from "@/src/components/pages/view-position-page/components/PositionView/v2-position-page";
import {UnifiedPoolId} from "@/src/hooks";

export default function V2PositionPage({
  poolKey,
  unifiedPoolId,
}: {
  poolKey?: string;
  unifiedPoolId: UnifiedPoolId;
}) {
  return (
    <main className="flex flex-col gap-4 mx-auto lg:w-[716px] w-full lg:px-4 lg:py-8">
      <V2PositionView poolKey={poolKey} unifiedPoolId={unifiedPoolId} />
    </main>
  );
}
