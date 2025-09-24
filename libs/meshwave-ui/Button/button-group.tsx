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
    typeof i === "object" ? i : ({value: i} as ButtonGroupItem<T>)
  );

  return (
    <div className={cn("inline-flex", fullWidth && "w-full", className)}>
      {normalized.map((item, i) => {
        const selected = item.value === value;
        const isFirst = i === 0;
        const isLast = i === normalized.length - 1;

        return (
          <button
            key={String(item.value)}
            disabled={item.disabled}
            className={cn(
              fullWidth && "w-full",
              "h-10 px-2 font-alt border bg-white dark:bg-background-grey-dark text-content-dimmed-light cursor-pointer",
              "hover:border hover:border-black dark:hover:text-content-primary dark:hover:border-accent-primary",
              isFirst && "rounded-l-lg",
              isLast && "rounded-r-lg",
              selected &&
                "border border-black dark:border-light-theme-5 bg-black dark:bg-background-grey-light text-white",
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
