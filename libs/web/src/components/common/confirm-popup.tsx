import {Button} from "@/meshwave-ui/Button";
import {BrandText} from "./BrandText/BrandText";

export const ConfirmPopup: React.FC<{
  onConfirm: VoidFunction;
  onDeny: VoidFunction;
  disconnectIsPending: boolean;
}> = ({onConfirm, onDeny, disconnectIsPending}) => {
  return (
    <section className="fixed top-0 left-0 z-[47] flex flex-col justify-center items-center w-screen h-screen bg-[#00000059] backdrop-blur-md">
      <form
        className="relative z-[48] w-[500px] h-[450px] overflow-y-scroll overflow-x-hidden bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-[#262834]  rounded-ten flex flex-col text-base leading-[24px] font-light
        max-[768px]:w-[343px] max-[768px]:h-[525px]"
      >
        {/* Header */}
        <div className="sticky top-0 left-0 z-[48] w-full px-[28px] pt-[20px] pb-[16px] flex justify-between items-center dark:bg-[#262834]  bg-background-grey-dark shadow-[1px_0px_2px_0px_#faf8f830]">
          <h2 className="text-[24px] leading-[32px] font-normal max-[768px]:text-[22px] max-[768px]:leading-[28px]">
            Disclaimer
          </h2>
        </div>

        {/* Description */}
        <p className="px-[28px] pt-[12px] pb-[16px]">
          By accessing this website or using the{" "}
          <BrandText microchain="Microchain Protocol" />, I
          confirm that:
        </p>

        {/* List */}
        <div className="flex flex-col gap-[12px] px-[28px] pb-4 pl-[28px] italic">
          <p>
            I am not a person or entity who resides in, is a citizen of, is
            incorporated in, or has a registered office in the United States of
            America or any other Prohibited Localities, as defined in the{" "}
            <a
              className="text-content-dimmed-light hover:text-content-primary"
              href="https://docs.mira.ly/resources/terms-and-conditions"
              target="_blank"
            >
              Terms of Use
            </a>
            .
          </p>
          <p>
            I will not access this site or use the{" "}
            <BrandText microchain="Microchain Protocol" />{" "}
            while located within the United States or any Prohibited Localities.
          </p>
          <p>
            I am not using, and will not use in the future, a VPN or other tools
            to obscure my physical location from a restricted territory.
          </p>
          <p>
            I am lawfully permitted to access this site and use the{" "}
            <BrandText microchain="Microchain DEX" />
            protocol under the laws of the jurisdiction in which I reside and am
            located.
          </p>
          <p>
            I understand the risks associated with using decentralized
            protocols, including the{" "}
            <BrandText microchain="Microchain Protocol" />,
            as outlined in the{" "}
            <a
              className="text-content-dimmed-light hover:text-content-primary"
              href="https://docs.mira.ly/resources/terms-and-conditions"
              target="_blank"
            >
              Terms of Use
            </a>{" "}
            and{" "}
            <a
              className="text-content-dimmed-light hover:text-content-primary"
              href="https://docs.mira.ly/resources/privacy-policy"
              target="_blank"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {/* Buttons */}
        <div className="sticky bottom-0 left-0 z-[48] w-full dark:bg-[#262834]  bg-background-grey-dark px-[28px] py-[24px] flex gap-[12px] shadow-[1px_0px_2px_0px_#faf8f830]">
          <Button
            className="h-[48px]"
            variant="outline"
            onClick={onDeny}
            loading={disconnectIsPending}
            block
          >
            Deny and Disconnect
          </Button>
          <Button className="h-[48px]" onClick={onConfirm} block>
            Sign and Confirm
          </Button>
        </div>
      </form>
    </section>
  );
};
