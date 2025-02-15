import {memo, useEffect, useState} from "react";
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
import SkeletonLoader from "../SkeletonLoader/SkeletonLoader";

type Props = {
  assetId: string;
  balance?: CoinQuantity | undefined;
};

const CoinListItem = ({assetId, balance}: Props) => {
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (verifiedAssetData && metadata && icon) {
      setLoading(false);
    }
  }, [verifiedAssetData, metadata, icon]);

  if (loading) {
    return <SkeletonLoader isLoading={true} count={1} textLines={1} />;
  }

  return (
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
  );
};

export default memo(CoinListItem);
