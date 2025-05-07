import {useQuery} from "@tanstack/react-query";

type Props = {
  firstAssetId: string;
  secondAssetId: string;
  isStablePool: boolean;
};

const useCheckPoolExists = ({
  firstAssetId,
  secondAssetId,
  isStablePool,
}: Props) => {
  const {data, isLoading} = useQuery({
    queryKey: ["poolExistence", firstAssetId, secondAssetId, isStablePool],
    queryFn: async () => {},
  });
};

export default useCheckPoolExists;
