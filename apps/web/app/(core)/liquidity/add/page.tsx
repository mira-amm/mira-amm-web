import {Suspense} from "react";
import AddLiquidityPage from "./add-liquidity-page";
import {Loader} from "@/src/components/common";

const Page = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          <Loader color="gray" />
        </div>
      }
    >
      <AddLiquidityPage />
    </Suspense>
  );
};

export default Page;
