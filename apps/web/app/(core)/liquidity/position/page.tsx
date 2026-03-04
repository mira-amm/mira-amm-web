import {PageSuspense, PoolRouter} from "@/src/components/common";
import PositionPage from "./position-page";
import V2PositionPage from "./v2-position-page";

type PageProps = {
  searchParams: Promise<{[key: string]: string | undefined}>;
};

export default async function Page({searchParams}: PageProps) {
  const {pool} = await searchParams;

  return (
    <PageSuspense>
      <PoolRouter
        pool={pool}
        renderV1={({poolKey}) => <PositionPage poolKey={poolKey} />}
        renderV2={({poolKey, unifiedPoolIdString}) => (
          <V2PositionPage
            poolKey={poolKey}
            unifiedPoolIdString={unifiedPoolIdString}
          />
        )}
      />
    </PageSuspense>
  );
}
