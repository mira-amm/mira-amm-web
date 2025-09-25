import * as React from "react";
import {cn} from "@/shadcn-ui/utils";

function Input({className, type, ...props}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground text-content-secondary dark:text-content-secondaryselection:bg-primary selection:text-primary-foreground bg-background-secondary border-background-grey-light flex h-9 w-full min-w-0 rounded-lg border p-3 text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:ring-black focus-visible:ring-[1px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export {Input};
