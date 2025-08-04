"use client";

import {Suspense} from "react";
import PositionPage from "./position-page";
import {Loader} from "@/src/components/common";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          <Loader color="gray" rebrand={getIsRebrandEnabled()} />
        </div>
      }
    >
      <PositionPage />
    </Suspense>
  );
}
