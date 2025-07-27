import {clsx} from "clsx";

export const DividerText: React.FC<{text: string; dimmed?: boolean}> = ({
  text,
  dimmed,
}) => {
  return (
    <li
      className={clsx(
        "text-xl leading-6 text-center font-normal m-0 list-none",
        "max-lg:text-[16px] max-lg:leading-[22px]",
        "max-[900px]:ml-4",
        dimmed && "text-content-dimmed-light"
      )}
    >
      {text}
    </li>
  );
};
