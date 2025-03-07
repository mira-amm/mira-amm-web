"use client";

import styles from "./PointsRankTable.module.css";
import {usePointsRanks} from "@/src/hooks/usePoints/usePoints";

// Define the data type for our table
type PointsRankData = {
  rank: number;
  address: string;
  points: number;
};

export default function PointsRankTable() {
  const {data, isLoading, error} = usePointsRanks(1, 10);

  // Since we can't use TanStack Table yet, we'll create a simple table

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    return <div>No data</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeader}>Rank</th>
            <th className={styles.tableHeader}>Address</th>
            <th className={styles.tableHeader}>Points</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: PointsRankData) => (
            <tr key={row.rank} className={styles.tableRow}>
              <td className={styles.tableCell}>{row.rank}</td>
              <td className={styles.tableCell}>{row.address}</td>
              <td className={styles.tableCell}>
                <div className={styles.pointsCell}>
                  <span className={styles.starIcon}>★</span>
                  {row.points.toFixed(0).toLocaleString()}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
