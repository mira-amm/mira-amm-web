import {memo} from "react";

export function SkeletonLoader({
  isLoading,
  count = 3,
  textLines = 2,
  children,
}: {
  isLoading: boolean;
  count?: number;
  textLines?: number;
  children?: React.ReactNode;
}) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="flex flex-col gap-4">
      {Array.from({length: count}).map((_, index) => (
        <div key={index} className="flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-background-grey-dark" />
          <div className="flex-1 flex flex-col gap-2">
            {Array.from({length: textLines}).map((_, i) => {
              const widths = ["w-4/5", "w-3/5", "w-2/3"];
              const width = widths[i] || "w-4/5";
              return (
                <div
                  key={i}
                  className={`${width} h-3 rounded bg-background-grey-dark`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
