"use client";

import {useIsConnected} from "@fuels/react";
import {BoostsBanner} from "./BoostsBanner/BoostsBanner";
import {BoostsRewards} from "./BoostsRewards/BoostsRewards";

export function Boosts() {
  const {isConnected} = useIsConnected();

  return (
    <section className="flex flex-col gap-6">
      {isConnected ? <BoostsRewards /> : <BoostsBanner />}
    </section>
  );
}
