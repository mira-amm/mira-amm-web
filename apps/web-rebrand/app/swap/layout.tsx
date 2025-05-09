import {ReactNode} from "react";
import {metadata} from "../metadata";

type Props = Readonly<{
  children: ReactNode;
}>;

export {metadata};

const SwapLayout = ({children}: Props) => {
  return <>{children}</>;
};

export default SwapLayout;
