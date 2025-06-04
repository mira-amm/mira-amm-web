import {ArrowDown, ArrowUp} from "lucide-react";
import {TableHead} from "@/meshwave-ui/table";
import {clsx} from "clsx";

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
}) {
  const [key, direction] = orderBy.split("_");
  const isActive = key === columnKey;

  return (
    <TableHead
      onClick={() => onSort(columnKey)}
      className={clsx(
        "cursor-pointer select-none transition-colors",
        "text-content-dimmed-dark",
        "gap-2 text-center flex items-center",
      )}
    >
      <div
        className={clsx(
          "flex justify-center gap-1",
          "lg:font-normal font-medium",
        )}
      >
        {title}
        <span
          className={clsx(
            "text-sm text-content-dimmed-dark transition-colors flex items-center",
            isActive && "text-white",
            "lg:w-4",
          )}
        >
          {isActive &&
            (direction === "DESC" ? (
              <ArrowDown className="size-4 text-content-dimmed-dark" />
            ) : (
              <ArrowUp className="size-4 text-content-dimmed-dark" />
            ))}
        </span>
      </div>
    </TableHead>
  );
}
