import {SettingsIcon} from "@/meshwave-ui/icons";
import {IconButton} from "@/src/components/common";

export function SlippageSetting({
  slippage,
  openSettingsModal,
}: {
  slippage: number;
  openSettingsModal: () => void;
}) {
  return (
    <>
      <p className="px-2 py-1 text-[13px] leading-4 font-normal rounded-lg bg-background-grey-light text-content-dimmed-light">
        {slippage / 100}% slippage
      </p>
      <IconButton
        onClick={openSettingsModal}
        className="hover:text-content-primary"
      >
        <SettingsIcon />
      </IconButton>
    </>
  );
}
