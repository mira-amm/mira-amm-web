"use client";

import styles from "./PointsRankTable.module.css";
import {usePointsRanks} from "@/src/hooks/usePoints/usePoints";
import Skeleton, {SkeletonTheme} from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Define the data type for our table
type PointsRankData = {
  rank: number;
  address: string;
  points: number;
};

export default function PointsRankTable() {
  const {data, isLoading, error} = usePointsRanks(1, 10);

  // Create skeleton rows when loading
  const renderSkeletonRows = () => {
    return Array(10)
      .fill(0)
      .map((_, index) => (
        <tr key={`skeleton-${index}`} className={styles.tableRow}>
          <td className={styles.tableCell}>
            <Skeleton width={20} />
          </td>
          <td className={styles.tableCell}>
            <Skeleton width="100%" />
          </td>
          <td className={styles.tableCell}>
            <Skeleton width={80} />
          </td>
        </tr>
      ));
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Rank</th>
              <th className={styles.tableHeader}>Address</th>
              <th className={styles.tableHeader}>Points</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? renderSkeletonRows()
              : data?.map((row: PointsRankData) => (
                  <tr key={row.rank} className={styles.tableRow}>
                    <td className={styles.tableCell}>{row.rank}</td>
                    <td className={styles.tableCell}>{row.address}</td>
                    <td className={styles.tableCell}>
                      <div className={styles.pointsCell}>
                        <span className={styles.pointsIcon}>♦</span>
                        {row.points.toFixed(0).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </SkeletonTheme>
    </div>
  );
}
