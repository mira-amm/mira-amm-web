import {useMemo} from "react";
import {useLocalStorage} from "usehooks-ts";

type LoadingLocalStorageProps = {
  key: string;
  initialValue: number;
  data?: any;
};

export const useLoadingLocalStorage = ({
  key,
  initialValue,
  data,
}: LoadingLocalStorageProps) => {
  const [storageValue, setStorageValue] = useLocalStorage(key, initialValue);

  return useMemo(() => {
    const initialCount = storageValue;
    if (data) {
      const freshCount = data.length;
      if (freshCount !== initialCount) {
        setStorageValue(freshCount);
        return freshCount;
      }
    }
    return initialCount;
  }, [data]);
};
