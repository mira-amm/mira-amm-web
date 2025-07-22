"use client";

import {CircleHelp} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/meshwave-ui/tooltip";

export function Info({tooltipText}: {tooltipText: string}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <button className="w-4 h-4 p-0 border-none bg-transparent cursor-pointer text-content-grey-dark hover:text-content-grey active:text-content-dimmed-dark">
          <CircleHelp className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
