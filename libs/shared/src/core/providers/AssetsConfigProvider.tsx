import {ReactNode} from "react";
import useAssetsConfig from "@/src/hooks/useAssetsConfig";

type Props = {
  children: ReactNode;
};

const AssetsConfigProvider = ({children}: Props) => {
  useAssetsConfig();

  return <>{children}</>;
};

export default AssetsConfigProvider;
