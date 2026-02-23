import React, {ReactNode} from "react";
import {clsx} from "clsx";
import {cn} from "@/src/utils/cn";

export function IconButton({
  children,
  onClick,
  className,
  type,
  isDisabled = false,
  ...rest
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  isDisabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "disabled" | "className">) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "flex justify-center items-center text-inherit bg-transparent border-none cursor-pointer disabled:cursor-not-allowed transition-opacity duration-200 hover:opacity-80 active:opacity-90",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
