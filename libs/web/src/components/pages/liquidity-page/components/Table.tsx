"use client";
import {PositionsLoader} from "./Positions/PositionsLoader";

export const Table = ({
  headers,
  rows,
  isLoading,
  leaveLastHeaderCellEmpty,
  LastHeaderCellAction,
  title,
}: {
  headers: string[];
  rows?: React.ReactNode[];
  dataTransformFunction?: (data: any) => string[];
  isLoading: boolean;
  leaveLastHeaderCellEmpty: boolean;
  LastHeaderCellAction?: React.ReactNode;
  title?: string;
}) => {
  return (
    <section className="flex flex-col gap-6 w-full">
      {title && <p className="text-xl leading-6">{title}</p>}
      {!rows || isLoading ? (
        <PositionsLoader />
      ) : (
        <div className="flex flex-col gap-4 bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark rounded-ten p-4">
          {/* Headers */}
          <div className="grid grid-cols-4 gap-4 px-2 pb-4 border-b border-background-grey-darkertext-content-tertiary text-md text-gray-400 font-normal">
            <div className="text-left">{headers[0]}</div>
            {/* itterate accross remaining headers */}
            {headers.slice(1, -1).map((header) => (
              <div className="text-center">{header}</div>
            ))}
            <div className="text-right">
              {leaveLastHeaderCellEmpty
                ? ""
                : LastHeaderCellAction
                  ? LastHeaderCellAction
                  : headers[headers.length - 1]}
            </div>
          </div>

          {/* Rows */}
          <div>{rows}</div>
        </div>
      )}
    </section>
  );
};
