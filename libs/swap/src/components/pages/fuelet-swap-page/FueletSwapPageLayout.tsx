"use client";

import BackLink from "../../common/BackLink/BackLink";
import Swap from "../../common/Swap/Swap";
import styles from "../swap-page/SwapPageLayout.module.css"; // styles for Swap
import pageStyles from "./FueletSwapPageLayout.module.css"; // custom styles for this page
import {clsx} from "clsx";
import {useConnect} from "@fuels/react";
import {FueletWalletConnector} from "@fuels/connectors";
// import { useRouter } from "next/navigation";
import {useEffect} from "react";

export const FueletSwapPageLayout = () => {
  // const router = useRouter();
  // const searchParams = new URLSearchParams(window.location.search);
  // const source = searchParams.get("source");
  const {connectAsync} = useConnect();

  const handleConnect = () => {
    connectAsync(FueletWalletConnector.name);
  };

  useEffect(() => {
    // if (source !== "fuelet") {
    //   router.push("/404");
    // } else {
    handleConnect();
    // }
  }, []);

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
