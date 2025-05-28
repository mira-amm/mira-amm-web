import {ArrowDownSmallIcon, ArrowUpSmallIcon} from "@/meshwave-ui/icons";
import styles from "./SortableColumn.module.css";

export default function SortableColumn({
  title,
  columnKey,
  orderBy,
  onSort,
}: {
  title: string;
  columnKey: string;
  orderBy: string;
  onSort: (key: string) => void;
}){
  const [key, direction] = orderBy.split("_");
  const isActive = key === columnKey;

  return (
    <th onClick={() => onSort(columnKey)} className={styles.sortable}>
      <div className={styles.sortArea}>
        {title}
        <span className={styles.sortIcon}>
          {isActive &&
            (direction === "DESC" ? (
              <ArrowDownSmallIcon />
            ) : (
              <ArrowUpSmallIcon />
            ))}
        </span>
      </div>
    </th>
  );
};
