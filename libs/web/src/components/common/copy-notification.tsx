import {
  NotificationCheckboxIcon,
  TransactionsCloseIcon,
} from "@/meshwave-ui/icons";

export const CopyNotification: React.FC<{
  onClose: () => void;
}> = ({onClose}) => {
  return (
    <div
      className={`
        bg-content-positive
        w-[480px]
        rounded-lg
        flex justify-between items-center
        px-[20px] py-[16px]
        absolute z-[1000]
        top-[calc(100vh-112%)] right-[calc(100vw-37%)]

        max-[768px]:w-[347px]
        max-[768px]:top-[calc(100vh-140%)] max-[768px]:right-[calc(100vw-92%)] max-[768px]:z-[500]
        max-[375px]:right-[calc(100vw-96%)]
        min-[1400px]:right-[calc(100vw-34%)]
        min-[1500px]:right-[calc(100vw-33%)]
      `}
    >
      <div className="flex gap-4 items-center">
        <NotificationCheckboxIcon />
        <span className="text-[16px] leading-[24px] font-normal text-content-primary m-0">
          Copied address
        </span>
      </div>
      <button
        onClick={onClose}
        className="border-none bg-transparent p-0 cursor-pointer"
      >
        <TransactionsCloseIcon />
      </button>
    </div>
  );
};
