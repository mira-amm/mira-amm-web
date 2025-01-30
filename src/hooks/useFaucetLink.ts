import {useAccount} from "@fuels/react";
import {useMemo} from "react";
import {useIsClient} from "usehooks-ts";
import useAppUrl from "./useAppUrl";

const useFaucetLink = () => {
  const {account} = useAccount();
  const isBrowser = useIsClient();

  const appUrl = useAppUrl();

  return useMemo(() => {
    let faucetUrl = appUrl;

    const urlParams = new URLSearchParams();

    if (account) {
      urlParams.append("address", account);
    }

    if (isBrowser) {
      const currentUrl = window.location.href;
      if (!urlParams.has("redirectUrl")) {
        urlParams.append("redirectUrl", currentUrl);
      }
    }

    if (urlParams.toString()) {
      faucetUrl += `?${urlParams.toString()}`;
    }

    return faucetUrl;
  }, [account, appUrl, isBrowser]);
};

export default useFaucetLink;
