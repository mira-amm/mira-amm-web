import {memo, useEffect} from "react";
import {clsx} from "clsx";
import {BN, CoinQuantity} from "fuels";

import styles from "./CoinListItem.module.css";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import SuccessIcon from "@/src/components/icons/Success/SuccessIcon";
import {checkIfCoinVerified} from "./checkIfCoinVerified";
import "react-tooltip/dist/react-tooltip.css";
import {Tooltip} from "react-tooltip";
import {useVerifiedAssets} from "@/src/hooks/useVerifiedAssets";
import Skeleton from "@/src/components/common/Swap/components/CoinListItem/Skeleton/Skeleton";
import {useLocalStorage} from "usehooks-ts";

type Props = {
  assetId: string;
  balance?: CoinQuantity | undefined;
  coinsLoaded: boolean;
  onLoad?: (assetId: string) => void;
};

const CoinListItem = ({assetId, balance, onLoad}: Props) => {
  const verifiedAssetData = useVerifiedAssets();
  const metadata = useAssetMetadata(assetId);
  const balanceValue = balance?.amount ?? new BN(0);
  const icon = useAssetImage(assetId);
  const isVerified = verifiedAssetData
    ? checkIfCoinVerified({
        symbol: metadata.symbol,
        assetId: assetId,
        verifiedAssetData,
      })
    : false;
  const [coinsLoaded] = useLocalStorage("coinsLoaded", false);

  // Ensuring that onLoad runs only once
  useEffect(() => {
    if (!coinsLoaded && metadata.name && icon) {
      onLoad?.(assetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata.name, icon, assetId, onLoad]);

  return coinsLoaded ? (
    <span className={clsx(styles.coin, !metadata.name && styles.centered)}>
      <Tooltip id="verified-tooltip" />
      {icon && <img src={icon} alt={`${metadata.name} icon`} />}
      <div className={styles.names}>
        <div className={styles.name_container}>
          <p className={styles.name}>{metadata.symbol}</p>
          {isVerified && (
            <span
              data-tooltip-id="verified-tooltip"
              data-tooltip-content="Verified asset from Fuel's official asset list."
            >
              <SuccessIcon />
            </span>
          )}
        </div>
        <p className={styles.fullName}>{metadata.name}</p>
      </div>
      {balanceValue.gt(0) && (
        <p className={styles.balance}>
          {balanceValue.formatUnits(metadata.decimals || 0)}
        </p>
      )}
    </span>
  ) : (
    <Skeleton />
  );
};

export default memo(CoinListItem);
