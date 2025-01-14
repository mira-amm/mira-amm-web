import boostRewards from "@/src/models/campaigns.json";

const usePoolNameAndMatch = (poolKey: string): {isMatching: boolean} => {
  const rewardsData = boostRewards[0].campaigns;

  const isMatching = rewardsData.some(
    (pool) => pool.pool.id === poolKey.replace(/0x/g, ""),
  );

  return {isMatching};
};

export default usePoolNameAndMatch;
