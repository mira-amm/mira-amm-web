import {ReactNode} from "react";
import {metadata} from "../metadata";
type Props = Readonly<{
  children: ReactNode;
}>;

export {metadata};

const WidgetLayout = ({children}: Props) => {
  return <>{children}</>;
};

export default WidgetLayout;
