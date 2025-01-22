import {clsx} from "clsx";
import {memo} from "react";

const XIcon = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(className)}
      width={55}
      height={55}
      viewBox="0 0 55 55"
      fill="none"
    >
      <path
        fill="currentColor"
        d="M32.192 23.003 52.295.138H47.53L30.076 19.99 16.134.138H.054L21.138 30.16.055 54.138h4.764l18.433-20.966 14.723 20.966h16.08L32.19 23.003h.001Zm-6.525 7.421-2.136-2.99L6.535 3.648h7.317l13.716 19.198 2.136 2.99 17.83 24.953h-7.318L25.667 30.426v-.002Z"
      />
    </svg>
  );
};

export default memo(XIcon);
