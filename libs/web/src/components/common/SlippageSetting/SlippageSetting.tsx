import { SettingsIcon } from "@/meshwave-ui/icons";
import IconButton from "@/src/components/common/IconButton/IconButton";

export function SlippageSetting({ slippage, openSettingsModal }: {
  slippage: number;
  openSettingsModal: () => void;
}){
  return (
    <>
      <p className="px-2 py-1 text-[13px] leading-4 font-normal rounded-lg bg-[var(--background-grey-light)] text-[var(--content-dimmed-light)]">
        {slippage / 100}% slippage
      </p>
      <IconButton
        onClick={openSettingsModal}
        className="hover:text-[var(--content-primary)]"
      >
        <SettingsIcon />
      </IconButton>
    </>
  );
};
