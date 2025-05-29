import {ActionButton}from "@/src/components/common";
import clsx from "clsx";

export const ConfirmPopup: React.FC<{
  onConfirm: VoidFunction;
  onDeny: VoidFunction;
  disconnectIsPending: boolean;
}> = ({ onConfirm, onDeny, disconnectIsPending }) => {
  return (
    <section className="fixed top-0 left-0 z-[47] flex flex-col justify-center items-center w-screen h-screen bg-[#00000059] backdrop-blur-md">
      <form
        className="relative z-[48] w-[500px] h-[450px] overflow-y-scroll overflow-x-hidden bg-[#262834] rounded-[16px] flex flex-col text-[16px] leading-[24px] font-light
        max-[768px]:w-[343px] max-[768px]:h-[525px]"
      >
        {/* Header */}
        <div
          className="sticky top-0 left-0 z-[48] w-full px-[28px] pt-[20px] pb-[16px] flex justify-between items-center bg-[#262834] shadow-[1px_0px_2px_0px_#faf8f830]"
        >
          <h2 className="text-[24px] leading-[32px] font-normal max-[768px]:text-[22px] max-[768px]:leading-[28px]">
            Disclaimer
          </h2>
        </div>

        {/* Description */}
        <p className="px-[28px] pt-[12px] pb-[16px]">
          By accessing this website or using the Mira Protocol, I confirm that:
        </p>

        {/* List */}
        <ul className="flex flex-col gap-[12px] px-[28px] pb-4 pl-[45px]">
          <li>
            I am not a person or entity who resides in, is a citizen of, is
            incorporated in, or has a registered office in the United States of
            America or any other Prohibited Localities, as defined in the{" "}
            <a
              className="text-[var(--content-dimmed-light)] hover:text-[var(--content-primary)]"
              href="https://docs.mira.ly/resources/terms-and-conditions"
              target="_blank"
            >
              Terms of Use
            </a>
            .
          </li>
          <li>
            I will not access this site or use the Mira Protocol while located
            within the United States or any Prohibited Localities.
          </li>
          <li>
            I am not using, and will not use in the future, a VPN or other tools
            to obscure my physical location from a restricted territory.
          </li>
          <li>
            I am lawfully permitted to access this site and use the Mira Dex
            protocol under the laws of the jurisdiction in which I reside and am
            located.
          </li>
          <li>
            I understand the risks associated with using decentralized
            protocols, including the Mira Protocol, as outlined in the{" "}
            <a
              className="text-[var(--content-dimmed-light)] hover:text-[var(--content-primary)]"
              href="https://docs.mira.ly/resources/terms-and-conditions"
              target="_blank"
            >
              Terms of Use
            </a>{" "}
            and{" "}
            <a
              className="text-[var(--content-dimmed-light)] hover:text-[var(--content-primary)]"
              href="https://docs.mira.ly/resources/privacy-policy"
              target="_blank"
            >
              Privacy Policy
            </a>
            .
          </li>
        </ul>

        {/* Buttons */}
        <div
          className="sticky bottom-0 left-0 z-[48] w-full bg-[#262834] px-[28px] py-[24px] flex gap-[12px] shadow-[1px_0px_2px_0px_#faf8f830]"
        >
          <ActionButton
            className={clsx("w-full h-[48px] text-[var(--accent-primary)] bg-transparent")}
            variant="outlined"
            onClick={onDeny}
            loading={disconnectIsPending}
          >
            Deny and Disconnect
          </ActionButton>
          <ActionButton className="w-full h-[48px]" onClick={onConfirm}>
            Sign and Confirm
          </ActionButton>
        </div>
      </form>
    </section>
  );
};
