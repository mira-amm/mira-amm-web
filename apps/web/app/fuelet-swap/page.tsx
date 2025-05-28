"use client";

import BackLink from "@/src/components/common/BackLink/BackLink";
import Swap from "@/src/components/common/Swap/Swap";
import {useConnect} from "@fuels/react";
import {FueletWalletConnector} from "@fuels/connectors";
// import { useRouter } from "next/navigation";
import {useEffect} from "react";

export default function Page(){
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
    <div className="flex flex-1 flex-col items-center w-full md:justify-center">
      <div className="w-full max-w-lg px-4">
        <Swap />
      </div>
    </div>
    </>
  );
};
