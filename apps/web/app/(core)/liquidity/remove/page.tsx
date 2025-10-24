import {PageSuspense, PoolRouter} from "@/src/components/common";
import RemoveLiquidityPage from "./remove-liquidity-page";
import V2RemoveLiquidityPage from "./v2-remove-liquidity-page";

type PageProps = {
  searchParams: Promise<{[key: string]: string | undefined}>;
};

export default async function Page({searchParams}: PageProps) {
  const {pool} = await searchParams;

  return (
    <PageSuspense>
      <PoolRouter
        pool={pool}
        renderV1={({poolKey}) => <RemoveLiquidityPage poolKey={poolKey} />}
        renderV2={({poolKey, unifiedPoolIdString}) => (
          <V2RemoveLiquidityPage
            poolKey={poolKey}
            unifiedPoolIdString={unifiedPoolIdString}
          />
        )}
      />
    </PageSuspense>
  );
}
