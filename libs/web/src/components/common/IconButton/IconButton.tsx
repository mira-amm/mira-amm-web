import { memo, ReactNode } from "react";
import { clsx } from "clsx";

const IconButton = ({ children, onClick, className, type }: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}) => {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      className={clsx(
        "flex justify-center items-center text-inherit bg-transparent border-none cursor-pointer transition-opacity duration-200 hover:opacity-80 active:opacity-90",
        className
      )}
    >
      {children}
    </button>
  );
};

export default memo(IconButton);
