"use client";

import {Suspense} from "react";
import PositionPage from "./position-page";
import {Loader} from "@/src/components/common";

export default function Page() {
  return (
    <Suspense fallback={<Loader color="gray" />}>
      <PositionPage />
    </Suspense>
  );
}
