import React from "react";
import { clsx } from "clsx";

export const UsedTechs: React.FC<{
  text: string;
  children: React.ReactNode;
  className?: string;
}> = ({ text, children, className }) => {
  return (
    <figure
      className={clsx(
        "flex items-center gap-4 font-light text-[20px] leading-6",
        "max-lg:text-[16px] max-lg:leading-[22px] max-lg:gap-3",
        className
      )}
    >
      <figcaption
        className={clsx(
          "text-[var(--content-dimmed-light)]",
          "max-lg:max-h-[22px] max-lg:min-w-[80px] max-lg:whitespace-nowrap",
          "max-[464px]:text-[14px]"
        )}
      >
        {text}
      </figcaption>
      {children}
    </figure>
  );
};
