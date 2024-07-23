import {Provider} from "@fuel-ts/account";
import {TestnetUrl} from "@/src/utils/constants";
import {useQuery} from "@tanstack/react-query";

const useProvider = () => {
  const { data } = useQuery({
    queryKey: ['provider'],
    queryFn: () => Provider.create(TestnetUrl),
  });

  return data;
};

export default useProvider;
