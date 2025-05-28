import {clsx} from "clsx";
import {BN, CoinQuantity} from "fuels";
import {memo} from "react";

import { SuccessIcon } from "@/meshwave-ui/icons";
import {CoinDataWithPrice} from "@/src/utils/coinsConfig";
import {Tooltip} from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import styles from "./CoinListItem.module.css";
import {useAssetImage} from "@/src/hooks/useAssetImage";

function CoinListItem({assetData}: {
  assetData: Omit<CoinDataWithPrice, "price"> & {
    userBalance?: CoinQuantity;
  };
}){
  const {isVerified, userBalance} = assetData;
  const balanceValue = userBalance?.amount ?? new BN(0);
  const fallbackIcon = useAssetImage(
    !assetData?.icon ? assetData.assetId : null,
  ); // fetch only if no image for the asset
  return (
    <span className={clsx(styles.coin, !assetData?.name && styles.centered)}>
      <Tooltip id="verified-tooltip" />

      <img
        src={assetData.icon || fallbackIcon}
        alt={`${assetData.name} icon`}
        width={40}
        height={40}
        fetchPriority="high"
      />

      <div className={styles.names}>
        <div className={styles.name_container}>
          <p className={styles.name}>{assetData.symbol}</p>
          {isVerified && (
            <span
              data-tooltip-id="verified-tooltip"
              data-tooltip-content="Verified asset from Fuel's official asset list."
            >
              <SuccessIcon />
            </span>
          )}
        </div>
        <p className={styles.fullName}>{assetData.name}</p>
      </div>
      {balanceValue.gt(0) && (
        <p className={styles.balance}>
          {balanceValue.formatUnits(assetData.decimals || 0)}
        </p>
      )}
    </span>
  );
};

export default memo(CoinListItem);
