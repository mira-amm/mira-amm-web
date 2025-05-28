"use client";

import { memo, useEffect, useRef } from "react";
import { InfoIcon } from "@/src/components/icons";

function Info({ tooltipText, tooltipKey, color }: {
  tooltipText: string;
  tooltipKey: string;
  color?: string;
}){
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const buttonId = `${tooltipKey}-button`;
  const tooltipId = `${tooltipKey}-tooltip`;

  useEffect(() => {
    const button = buttonRef.current;
    const tooltip = tooltipRef.current;

    if (button && tooltip) {
      button.style.setProperty("anchor-name", `--${buttonId}`);
      tooltip.style.setProperty("position-anchor", `--${buttonId}`);
    }
  }, [buttonId]);

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        const tooltip = tooltipRef.current;
        if (tooltip) tooltip.style.visibility = "visible";
      }}
      onMouseLeave={() => {
        const tooltip = tooltipRef.current;
        if (tooltip) tooltip.style.visibility = "hidden";
      }}
    >
      <button
        id={buttonId}
        ref={buttonRef}
        className="w-4 h-4 p-0 border-none bg-transparent cursor-pointer text-[var(--content-grey-dark)] hover:text-[var(--content-grey)] active:text-[var(--content-dimmed-dark)]"
        style={{ anchorName: `--${buttonId}` }}
      >
        <InfoIcon color={color} />
      </button>

      <div
        id={tooltipId}
        ref={tooltipRef}
        className="fixed max-w-[200px] text-sm leading-4 font-normal p-2 rounded-lg bg-[var(--background-secondary)] text-[var(--content-dimmed-dark)] z-[1000] invisible transition-opacity duration-200 ease-in-out"
        style={{
          positionAnchor: `--${buttonId}`,
          top: "anchor(50%)",
          left: "anchor(50%)",
          color: color,
        }}
      >
        {tooltipText}
      </div>
    </div>
  );
};

export default memo(Info);
