import {ReactNode} from "react";

export function TextButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: VoidFunction;
}) {
  return (
    <button
      onClick={onClick}
      className="border-none bg-transparent p-0 text-accent-primary-1 dark:text-accent-primary-1 font-inherit cursor-pointer inline-block transition-opacity duration-200 hover:opacity-80"
    >
      {children}
    </button>
  );
}
