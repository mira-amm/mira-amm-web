import {Suspense} from "react";
import AddLiquidityPage from "./add-liquidity-page";
import {Loader} from "@/src/components/common";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";
import AddBinLiquidityPage from "@/src/components/pages/bin-liquidity/add-bin-liquidity-page";

type PageProps = {
  searchParams: Promise<{[key: string]: string | undefined}>;
};

export default async function Pag({searchParams}: PageProps) {
  const isRebrandEnabled = getIsRebrandEnabled();

  const {pool, binned} = await searchParams;

  const render = () => {
    if (!pool) return;
    if (binned === "true") {
      return <AddBinLiquidityPage poolKey={pool} />;
    }

    return <AddLiquidityPage />;
  };

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          <Loader color="gray" rebrand={isRebrandEnabled} />
        </div>
      }
    >
      {render()}
    </Suspense>
  );
}
