import Image from "next/image";
import styles from "./SortableColumn.module.css";
import ArrowUpDown from "@/assets/arrow-up-down.svg";

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
        <p className="mc-type-m">{title}</p>
        <span className={styles.sortIcon}>
          {
            isActive && (
              <Image
                src={ArrowUpDown}
                alt="sort-icon"
                width={12}
                height={20}
                priority
              />
            )

            // (direction === "DESC" ? (
            //   <ArrowDownSmallIcon />
            // ) : (
            //   <ArrowUpSmallIcon />
            // ))
          }
        </span>
      </div>
    </th>
  );
};
export default SortableColumn;
