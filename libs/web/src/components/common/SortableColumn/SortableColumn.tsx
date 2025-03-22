import {ArrowDownSmallIcon} from "../../icons/ArrowDown/ArrowDownSmallIcon";
import {ArrowUpSmallIcon} from "../../icons/ArrowUp/ArrowUpSmallIcon";
import styles from "./SortableColumn.module.css";

type SortableColumnProps = {
  title: string;
  columnKey: string;
  orderBy: string;
  onSort: (key: string) => void;
};

const SortableColumn = ({
  title,
  columnKey,
  orderBy,
  onSort,
}: SortableColumnProps) => {
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
export default SortableColumn;
