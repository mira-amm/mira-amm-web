"use client";

import BackLink from "../../common/BackLink/BackLink";
import Swap from "../../common/Swap/Swap";
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
    <>
      <BackLink
        title="Powered by mira.ly"
        href="https://mira.ly"
      />
      <Swap />
    </>
  );
};
