import {Suspense} from "react";
import AddLiquidityPage from "./add-liquidity-page";
import {Loader} from "@/src/components/common";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";
import V2AddLiquidityPage from "./v2-add-liquidity-page";
import {parsePoolKey, detectPoolType} from "@/src/utils/poolTypeDetection";

type PageProps = {
  searchParams: Promise<{[key: string]: string | undefined}>;
};

export default async function Page({searchParams}: PageProps) {
  const isRebrandEnabled = getIsRebrandEnabled();

  const {pool} = await searchParams;

  const render = () => {
    if (!pool) return <AddLiquidityPage />;

    // Detect pool type server-side
    try {
      const unifiedPoolId = parsePoolKey(pool);
      const poolType = detectPoolType(unifiedPoolId);

      // Render appropriate component based on pool type
      if (poolType === "v2") {
        return <V2AddLiquidityPage />;
      }

      return <AddLiquidityPage />;
    } catch (error) {
      console.error("Failed to parse pool key:", error);
      // Fallback to v1 page if parsing fails
      return <AddLiquidityPage />;
    }
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
