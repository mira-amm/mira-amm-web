import {Suspense} from "react";
import AddLiquidityPage from "./add-liquidity-page";
import {Loader} from "@/src/components/common";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";
import AddBinLiquidityPage from "@/src/components/pages/bin-liquidity/add-bin-liquidity-page";
import AddLiquidityWithRouting from "./add-liquidity-with-routing";

type PageProps = {
  searchParams: Promise<{[key: string]: string | undefined}>;
};

export default async function Page({searchParams}: PageProps) {
  const isRebrandEnabled = getIsRebrandEnabled();

  const {pool, binned} = await searchParams;

  const render = () => {
    if (!pool) return <AddLiquidityPage />;

    // Legacy binned parameter support
    if (binned === "true") {
      return <AddBinLiquidityPage poolKey={pool} />;
    }

    // Use routing component that detects pool type automatically
    return <AddLiquidityWithRouting poolKey={pool} />;
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
