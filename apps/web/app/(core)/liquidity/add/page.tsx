import {Suspense} from "react";
import AddLiquidityPage from "./add-liquidity-page";
import {Loader} from "@/src/components/common";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";

export default function Page() {
  const isRebrandEnabled = getIsRebrandEnabled();
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          <Loader color="gray" rebrand={isRebrandEnabled} />
        </div>
      }
    >
      <AddLiquidityPage />
    </Suspense>
  );
}
