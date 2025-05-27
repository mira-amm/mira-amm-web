"use client";

import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from "../add-liquidity-page/AddLiquidityPageLayout.module.css";
import CreatePool from "./components/CreatePool/CreatePool";
import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useRef} from "react";
import {isPoolKeyValid} from "@/src/utils/common";

const CreatePoolPageLayout = () => {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollIntoView();
    }
  }, []);

  return (
    <main className={styles.addLiquidityLayout} ref={mainRef}>
      <CreatePool />
    </main>
  );
};

export default CreatePoolPageLayout;
