import {Suspense} from "react";
import {Loader} from "@/src/components/common";
import RemoveLiquidityWithRouting from "./remove-liquidity-with-routing";
import RemoveLiquidityPage from "./remove-liquidity-page";

type PageProps = {
  searchParams: Promise<{[key: string]: string | undefined}>;
};

export default async function Page({searchParams}: PageProps) {
  const {pool} = await searchParams;

  const render = () => {
    if (!pool) return <RemoveLiquidityPage />;
    return <RemoveLiquidityWithRouting poolKey={pool} />;
  };

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          <Loader color="gray" rebrand={true} />
        </div>
      }
    >
      {render()}
    </Suspense>
  );
}
