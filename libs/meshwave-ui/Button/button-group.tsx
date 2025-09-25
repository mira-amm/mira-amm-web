import {cn} from "@/src/utils/cn";
import {ReactNode} from "react";

export type ButtonGroupItem<T extends string | number> = {
  value: T;
  label?: string;
  disabled?: boolean;
};

export type ButtonGroupProps<T extends string | number> = {
  items: Array<T | ButtonGroupItem<T>>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
  buttonClassName?: string;
  fullWidth?: boolean;
  renderItem?: (item: ButtonGroupItem<T>, selected: boolean) => ReactNode;
};

export function ButtonGroup<T extends string | number>({
  items,
  value,
  onChange,
  className,
  buttonClassName,
  fullWidth = true,
  renderItem,
}: ButtonGroupProps<T>) {
  const normalized = items.map((i) =>
    typeof i === "object"
      ? (i as ButtonGroupItem<T>)
      : ({value: i} as ButtonGroupItem<T>)
  );

  return (
    <div
      className={cn("inline-flex", fullWidth && "w-full", className)}
      role="group"
    >
      {normalized.map((item, i) => {
        const selected = item.value === value;
        const isFirst = i === 0;
        const isLast = i === normalized.length - 1;

        return (
          <button
            key={String(item.value)}
            type="button"
            aria-pressed={selected}
            disabled={item.disabled}
            className={cn(
              fullWidth ? "flex-1" : "px-3",
              "relative h-10 px-2 font-alt box-border border cursor-pointer dark:border-light-theme-5",
              isFirst && "rounded-l-lg",
              isLast && "rounded-r-lg",
              "text-content-dimmed-light hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-light-theme-5",
              selected &&
                "bg-black text-white dark:bg-white dark:text-black border-black dark:border-light-theme-5",
              item.disabled && "opacity-50 cursor-not-allowed",
              buttonClassName
            )}
            onClick={() => !item.disabled && onChange(item.value)}
          >
            {renderItem
              ? renderItem(item, selected)
              : (item.label ?? String(item.value))}
          </button>
        );
      })}
    </div>
  );
}
