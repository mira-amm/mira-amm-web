import {useQuery} from "@tanstack/react-query";
import {calculateSHA256Hash} from "@/src/utils/common";

export function useSHA256Hash(message: string){
  const {data} = useQuery({
    queryKey: ["hash", message],
    queryFn: () => calculateSHA256Hash(message),
  });

  return {hash: data};
};
