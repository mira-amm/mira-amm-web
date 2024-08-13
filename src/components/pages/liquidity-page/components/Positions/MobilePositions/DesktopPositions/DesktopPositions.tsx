import {isMobile} from "react-device-detect";

import CoinPair from "@/src/components/common/CoinPair/CoinPair";

import styles from './DesktopPositions.module.css';
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";

const DesktopPositions = () => {
  if (isMobile) {
    return null;
  }

  return (
    <table className={styles.desktopPositions}>
      <thead>
      <tr>
        <th style={{ textAlign: 'left' }}>Positions</th>
        <th style={{ textAlign: 'center' }}>Selected Price</th>
        <th style={{ textAlign: 'right' }}>
          <button className={styles.hideButton}>
            Hide closed positions
          </button>
        </th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>
          <CoinPair firstCoin="ETH" secondCoin="USDT"/>
        </td>
        <td style={{textAlign: 'center'}}>
          {`0 UNI <> ∞ UNI`}
        </td>
        <td className={styles.labelCell}>
          <PositionLabel/>
        </td>
      </tr>
      <tr>
        <td>
          <CoinPair firstCoin="ETH" secondCoin="USDT"/>
        </td>
        <td style={{textAlign: 'center'}}>
          {`0 UNI <> ∞ UNI`}
        </td>
        <td className={styles.labelCell}>
          <PositionLabel/>
        </td>
      </tr>
      </tbody>
    </table>
  )
};

export default DesktopPositions;
