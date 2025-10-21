import AddLiquidityPage from "./add-liquidity-page";
import V2AddLiquidityPage from "./v2-add-liquidity-page";
import {PageSuspense, PoolRouter} from "@/src/components/common";

type PageProps = {
  searchParams: Promise<{[key: string]: string | undefined}>;
};

export default async function Page({searchParams}: PageProps) {
  const {pool} = await searchParams;

  return (
    <PageSuspense>
      <PoolRouter
        pool={pool}
        renderV1={() => <AddLiquidityPage />}
        renderV2={() => <V2AddLiquidityPage />}
      />
    </PageSuspense>
  );
}
