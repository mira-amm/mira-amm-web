import {useQuery} from "@tanstack/react-query";

const useAssetsConfig = () => {
  const {data} = useQuery({
    queryKey: ["assetsConfig"],
    queryFn: async () => {
      const response = await fetch(
        "https://fuel-assets-config.s3.amazonaws.com/mainnet-assets.json",
      );
      return response.json();
    },
    enabled: false,
  });
};

export default useAssetsConfig;
