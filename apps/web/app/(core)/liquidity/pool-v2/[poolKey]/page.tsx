import {Suspense} from "react";
import {Loader} from "@/src/components/common";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";
import PoolV2Page from "./pool-v2-page";

type PageProps = {
  params: Promise<{poolKey: string}>;
};

export default async function Page({params}: PageProps) {
  const isRebrandEnabled = getIsRebrandEnabled();
  const {poolKey} = await params;

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          <Loader color="gray" rebrand={isRebrandEnabled} />
        </div>
      }
    >
      <PoolV2Page poolKey={poolKey} />
    </Suspense>
  );
}
