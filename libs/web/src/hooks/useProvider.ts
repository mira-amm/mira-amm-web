import {Provider} from "fuels";
import {NetworkUrl} from "@/src/utils/constants";
import {useQuery} from "@tanstack/react-query";

export function useProvider() {
  const {data} = useQuery({
    queryKey: ["provider"],
    queryFn: () => new Provider(NetworkUrl),
    staleTime: Infinity,
  });

  return data;
}
