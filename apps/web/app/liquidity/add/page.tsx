import {Suspense} from "react";
import AddLiquidityPage from "./add-liquidity-page";
import {Loader} from "@/src/components/common";

const Page = () => {
  return (
    <Suspense fallback={<Loader color="gray" />}>
      <AddLiquidityPage />
    </Suspense>
  );
};

export default Page;
