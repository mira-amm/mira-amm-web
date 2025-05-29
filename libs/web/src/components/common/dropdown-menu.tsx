import React, { forwardRef } from "react";
import clsx from "clsx";

 export const DropDownMenu = forwardRef<HTMLUListElement, {
  buttons: {
    icon: React.FC;
    text: string;
    onClick: () => void;
    disabled?: boolean;
    tooltip?: string;
  }[];
  children?: React.ReactNode;
 }>(
  function DropDownMenu({ buttons, children }, ref) {
    return (
      <ul
        ref={ref}
        className={clsx(
          "absolute top-[50px] right-[-5px] z-20 max-w-[205px] p-[10px] rounded-[12px] bg-[#262834] flex flex-col box-border",
          "max-[1023px]:fixed max-[1023px]:top-auto max-[1023px]:left-0 max-[1023px]:right-0 max-[1023px]:bottom-0 max-[1023px]:w-full max-[1023px]:max-w-full max-[1023px]:rounded-t-[12px] max-[1023px]:pt-[38px]"
        )}
      >
        {buttons.map((button) => (
          <li key={button.text} className="relative">
            <button
              onClick={button.onClick}
              disabled={button.disabled}
              className={clsx(
                "flex items-center w-full gap-[10px] px-[10px] py-[8px] text-left rounded transition-colors",
                button.disabled
                  ? "cursor-default bg-[#262834] text-[var(--content-grey)]"
                  : "cursor-pointer text-[var(--content-primary)] hover:bg-[var(--background-grey-dark)]",
              )}
            >
              <button.icon />
              <span
                className={clsx(
                  "font-normal leading-6 whitespace-nowrap",
                  "text-[15px] max-[1023px]:text-[18px]"
                )}
              >
                {button.text}
              </span>

              {button.disabled && button.tooltip && (
                <div
                  className={clsx(
                    "absolute z-10 px-2 py-[3px] text-[10px] leading-[14px] font-medium rounded-[20px] whitespace-nowrap",
                    "bg-[var(--accent-primary)] text-[#292929]",
                    "left-[-60px] top-1/2 translate-y-[-50%] ml-2",
                    "max-[1023px]:left-[210px] max-[1023px]:top-[64%] max-[1023px]:visible",
                    "invisible group-hover:visible"
                  )}
                >
                  {button.tooltip}
                </div>
              )}
            </button>
          </li>
        ))}
        {children && <div>{children}</div>}
      </ul>
    );
  }
);
