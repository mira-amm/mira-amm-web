import {useMemo} from "react";
import {ReadonlyMiraAmm} from "mira-dex-ts";
import useProvider from "@/src/hooks/useProvider/useProvider";

const useReadonlyMira = () => {
  const provider = useProvider();

  return useMemo(() => {
    if (provider) {
      return new ReadonlyMiraAmm(
        provider,
      );
    }
  }, [provider]);
};

export default useReadonlyMira;
