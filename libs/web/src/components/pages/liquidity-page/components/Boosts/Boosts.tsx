'use client'

import {useIsConnected} from "@fuels/react";
import styles from "./Boosts.module.css";
import { BoostsBanner } from "./BoostsBanner/BoostsBanner";
import { BoostsRewards } from "./BoostsRewards/BoostsRewards";

export function Boosts(){
  const {isConnected, isPending: isConnecting} = useIsConnected();

  return (
    <section className={styles.boosts}>
      {isConnected ? <BoostsRewards /> : <BoostsBanner />}
    </section>
  );
};
