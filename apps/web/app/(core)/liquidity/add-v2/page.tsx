import {Suspense} from "react";
import {Loader} from "@/src/components/common";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";
import AddLiquidityV2Page from "./add-liquidity-v2-page";

type PageProps = {
  searchParams: Promise<{[key: string]: string | undefined}>;
};

export default async function Page({searchParams}: PageProps) {
  const isRebrandEnabled = getIsRebrandEnabled();
  const {pool} = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          <Loader color="gray" rebrand={isRebrandEnabled} />
        </div>
      }
    >
      <AddLiquidityV2Page poolKey={pool} />
    </Suspense>
  );
}
