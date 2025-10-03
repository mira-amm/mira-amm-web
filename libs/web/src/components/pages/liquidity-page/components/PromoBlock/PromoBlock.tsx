import {cn} from "@/src/utils/cn";
import {ReactNode} from "react";

export default function PromoBlock({
  icon,
  title,
  link,
  linkText,
  background,
}: {
  icon: ReactNode;
  title: ReactNode;
  link: string;
  linkText: ReactNode;
  background: "overlay-4" | "overlay-1" | "gradient" | "black";
}) {
  return (
    <a
      href={link}
      target="_blank"
      className="w-full flex gap-2.5 p-3 rounded-lg bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark group"
      rel="noopener noreferrer"
    >
      <div
        className={cn(
          "flex items-center justify-center w-11 h-11 rounded  bg-cover text-white",
          background === "overlay-4" && "bg-[url('/images/overlay-4.jpg')]",
          background === "overlay-1" && "bg-[url('/images/overlay-1.jpg')]",
          background === "gradient" &&
            "bg-[linear-gradient(96.75deg,_#BEFA15_-106.79%,_#5872FC_48.13%,_#C41CFF_168.79%)]",
          background === "black" && "bg-black"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1">
        <p className="">{title}</p>
        <p className="text-sm leading-4 text-content-dimmed-light group-hover:text-content-primary">
          {linkText}
        </p>
      </div>
    </a>
  );
}
