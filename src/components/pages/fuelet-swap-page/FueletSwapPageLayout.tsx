"use client";

import BackLink from "../../common/BackLink/BackLink";
import Swap from "../../common/Swap/Swap";
import styles from "../swap-page/SwapPageLayout.module.css"; // styles for Swap
import pageStyles from "./FueletSwapPageLayout.module.css"; // custom styles for this page
import { clsx } from "clsx";
// import { useRouter } from "next/router";
// import { useEffect } from "react";

export const FueletSwapPageLayout = () => {
//   const router = useRouter();
//   const { source } = router.query;

//   useEffect(() => {
//     if (source !== "fuelet") {
//       router.push("/404");
//     }
//   }, [source, router]);

  return (
    <section className={clsx(pageStyles.page, styles.swapLayout)}>
      <BackLink
        title="Powered by mira.ly"
        className={pageStyles.link}
        href="https://mira.ly"
      />
      <Swap />
    </section>
  );
};
