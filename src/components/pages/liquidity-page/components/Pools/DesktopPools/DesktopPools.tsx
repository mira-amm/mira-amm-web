import {isMobile} from "react-device-detect";

import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";

import styles from './DesktopPools.module.css';
import {useRouter} from "next/navigation";

const DesktopPools = () => {
  const router = useRouter();

  if (isMobile) {
    return null;
  }

  const handleAddClick = () => {
    router.push('/liquidity/add');
  };

  return (
    <table className={styles.desktopPools}>
      <thead>
      <tr>
        <td>Pools</td>
        <td>APR</td>
        <td>24H Volume</td>
        <td>TVL</td>
        <td/>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>
          <CoinPair firstCoin="ETH" secondCoin="USDT"/>
        </td>
        <td>
          68,78%
        </td>
        <td>
          $456,567
        </td>
        <td>
          $1,307,567
        </td>
        <td>
          <ActionButton className={styles.addButton} onClick={handleAddClick}>
            Add Liquidity
          </ActionButton>
        </td>
      </tr>
      <tr>
        <td>
          <CoinPair firstCoin="ETH" secondCoin="USDT"/>
        </td>
        <td>
          68,78%
        </td>
        <td>
          $456,567
        </td>
        <td>
          $1,307,567
        </td>
        <td>
          <ActionButton className={styles.addButton} onClick={handleAddClick}>
            Add Liquidity
          </ActionButton>
        </td>
      </tr>
      <tr>
        <td>
          <CoinPair firstCoin="ETH" secondCoin="USDT"/>
        </td>
        <td>
          68,78%
        </td>
        <td>
          $456,567
        </td>
        <td>
          $1,307,567
        </td>
        <td>
          <ActionButton className={styles.addButton} onClick={handleAddClick}>
            Add Liquidity
          </ActionButton>
        </td>
      </tr>
      </tbody>
    </table>
  )
};

export default DesktopPools;
