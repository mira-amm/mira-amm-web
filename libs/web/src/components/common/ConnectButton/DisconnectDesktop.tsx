import { useAccount, useDisconnect, useIsConnected } from "@fuels/react";
import { clsx } from "clsx";
import { memo } from "react";

import { useFormattedAddress } from "@/src/hooks";
import {ActionButton}from "@/src/components/common";

const DisconnectDesktop = ({ className }: { className?: string }) => {
  const { isConnected } = useIsConnected();
  const { account } = useAccount();
  const { disconnect } = useDisconnect();
  const formattedAddress = useFormattedAddress(account);

  if (!isConnected) {
    return null;
  }

  return (
    <ActionButton
      className={clsx(
        className,
        "flex items-center gap-[10px] px-2 py-4 text-content-primary border border-accent-primary bg-transparent shadow-none hover:shadow-none active:bg-transparent"
      )}
      onClick={disconnect}
    >
      <img src="/images/avatar.png" width="24" height="24" />
      {formattedAddress}
      {isConnected && (
        <span className={clsx(
          "rounded-[20px] font-medium text-[10px] leading-[14px] text-background-primary bg-accent-primary",
          "opacity-0 max-w-0 p-0 ml-0",
          "transition-[opacity,max-width,padding,margin-left] duration-500",
          "group-hover:opacity-100 group-hover:max-w-[200px] group-hover:px-2 group-hover:py-[3px] group-hover:ml-1"
        )}>
          disconnect
        </span>
      )}
    </ActionButton>
  );
};

export default memo(DisconnectDesktop);
