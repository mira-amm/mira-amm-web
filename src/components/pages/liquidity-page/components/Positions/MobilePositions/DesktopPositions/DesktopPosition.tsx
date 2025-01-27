import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {B256Address, formatUnits} from "fuels";
import {buildPoolId} from "mira-dex-ts";
import styles from "./DesktopPosition.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import Link from "next/link";
import {createPoolKey} from "@/src/utils/common";
import usePoolAPR from "@/src/hooks/usePoolAPR";
import AprBadge from "@/src/components/common/AprBadge/AprBadge";
import usePoolNameAndMatch from "@/src/hooks/usePoolNameAndMatch";
import {DefaultLocale} from "@/src/utils/constants";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";

interface Props {
  assetIdA: B256Address;
  assetIdB: B256Address;
  amountA: string;
  amountB: string;
  isStablePool: boolean;
  priceA: number;
  priceB: number;
}

export const DesktopPosition = ({
  assetIdA,
  assetIdB,
  amountA,
  amountB,
  isStablePool,
  priceA,
  priceB,
}: Props): JSX.Element => {
  const assetAMetadata = useAssetMetadata(assetIdA);
  const assetBMetadata = useAssetMetadata(assetIdB);

  const amountInUsdA = priceA;
  const amountInUsdB = priceB;

  const coinAAmount = formatUnits(amountA, assetAMetadata.decimals);
  const coinBAmount = formatUnits(amountB, assetBMetadata.decimals);

  const size =
    parseFloat(coinAAmount) * amountInUsdA +
    parseFloat(coinBAmount) * amountInUsdB;

  const poolId = buildPoolId(assetIdA, assetIdB, isStablePool);
  const poolKey = createPoolKey(poolId);
  const positionPath = `/liquidity/position?pool=${poolKey}`;

  const {apr} = usePoolAPR(poolId);
  const aprValue = apr
    ? `${apr.apr.toLocaleString(DefaultLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`
    : null;
  const tvlValue = apr?.tvlUSD;
  //Checks if the pool with rewards matches the current pool
  const {isMatching} = usePoolNameAndMatch(poolKey);

  return (
    <tr>
      <td>
        <CoinPair
          firstCoin={assetIdA}
          secondCoin={assetIdB}
          isStablePool={poolId[2]}
          withPoolDescription
        />
      </td>
      <td className={styles.labelCell}>
        {isMatching ? (
          <div className={styles.aprBadge}>
            <AprBadge
              aprValue={aprValue}
              poolKey={poolKey}
              tvlValue={tvlValue}
            />
          </div>
        ) : (
          <p>{aprValue}</p>
        )}
      </td>
      <td className={styles.labelCell}>
        {size ? (
          `$ ${size.toFixed(2)}`
        ) : (
          <p className={styles.loadingText}>{"checking..."}</p>
        )}
      </td>
      <td className={styles.labelCell}>
        <Link href={positionPath}>
          <ActionButton className={styles.addButton} variant="secondary">
            Manage position
          </ActionButton>
        </Link>
      </td>
    </tr>
  );
};
