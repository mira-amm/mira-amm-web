import {clsx} from "clsx";
import {memo} from "react";

import {FuelIcon} from "@/src/components/icons";

import styles from "./TestnetLabel.module.css";
import {useProvider} from "@fuels/react";

type Props = {
  className?: string;
};

function getNetworkNameFromUrl(url: string | undefined): string {
  if (url?.includes("mainnet")) {
    return "Mainnet";
  } else if (url?.includes("testnet")) {
    return "Testnet";
  } else {
    return "";
  }
}

const TestnetLabel = ({className}: Props) => {
  const {provider} = useProvider();
  const networkName = getNetworkNameFromUrl(provider?.url);

  return (
    <div className={clsx(styles.testnetLabel, className)}>
      <FuelIcon />
      {networkName}
    </div>
  );
};

export default memo(TestnetLabel);
