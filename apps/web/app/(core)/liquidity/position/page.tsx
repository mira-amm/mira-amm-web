"use client";

import {Suspense} from "react";
import PositionPage from "./position-page";
import {Loader} from "@/src/components/common";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          <Loader />
        </div>
      }
    >
      <PositionPage />
    </Suspense>
  );
}
