import {clsx} from "clsx";
import {BN, CoinQuantity} from "fuels";
import {memo} from "react";

import VerifiedIcon from "@/src/components/icons/Verified/VerifiedIcon";
import {CoinDataWithPrice} from "@/src/utils/coinsConfig";
import {Tooltip} from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import styles from "./CoinListItem.module.css";
import {FallbackImage} from "../../../FallbackImage/FallbackImage";

type Props = {
  assetData: Omit<CoinDataWithPrice, "price"> & {
    userBalance?: CoinQuantity;
  };
};

const CoinListItem = ({assetData}: Props) => {
  const {isVerified, userBalance} = assetData;
  const balanceValue = userBalance?.amount ?? new BN(0);

  return (
    <span className={clsx(styles.coin, !assetData?.name && styles.centered)}>
      <Tooltip id="verified-tooltip" />

      <FallbackImage
        src={assetData.icon}
        alt={`${assetData.name} icon`}
        width={40}
        height={40}
        priority
      />

      <div className={styles.names}>
        <div className={styles.name_container}>
          <p className="mc-type-xl">{assetData.symbol}</p>
          {isVerified && (
            <span
              data-tooltip-id="verified-tooltip"
              data-tooltip-content="Verified asset from Fuel's official asset list."
            >
              <VerifiedIcon />
            </span>
          )}
        </div>
        <p className={clsx(styles.fullName, "mc-type-m")}>{assetData.name}</p>
      </div>
      {balanceValue.gt(0) && (
        <p className={clsx(styles.balance, "mc-mono-b")}>
          {balanceValue.formatUnits(assetData.decimals || 0)}
        </p>
      )}
    </span>
  );
};

export default memo(CoinListItem);