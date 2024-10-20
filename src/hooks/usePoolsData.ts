import {useQuery} from "@tanstack/react-query";
import {CoinName} from "@/src/utils/coinsConfig";
import {createPoolIdString} from "@/src/utils/common";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import {buildPoolId} from "mira-dex-ts";

export type PoolData = {
  id: string;
  reserve_0: string;
  reserve_1: string;
  details: {
    asset_0_symbol: CoinName;
    asset_1_symbol: CoinName;
    apr: string | null;
    volume: string;
    tvl: string;
  };
  swap_count: number;
  create_time: number;
};

export type PoolsData = {
  pools: PoolData[];
};

const usePoolsData = () => {
  const miraAmm = useReadonlyMira();
  const { data, isLoading } = useQuery({
    queryKey: ['pools'],
    queryFn: async () => {
      const poolIds = [
        buildPoolId("0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07", "0x91b3559edb2619cde8ffb2aa7b3c3be97efd794ea46700db7092abeee62281b0", true),
        buildPoolId("0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b", "0x9e46f919fbf978f3cad7cd34cca982d5613af63ff8aab6c379e4faa179552958", true),
        buildPoolId("0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07", "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b", false),
      ]
      const poolsData: Promise<PoolData>[] = poolIds.map(async id => {
        const poolMeta = await miraAmm!.poolMetadata(id);
        console.log('meta', poolMeta);
        return {
          id: createPoolIdString(id),
          reserve_0: poolMeta!.reserve0.toString(),
          reserve_1: poolMeta!.reserve1.toString(),
          details: {
            asset_0_symbol: 'A' as CoinName,
            asset_1_symbol: 'B' as CoinName,
            apr: null,
            volume: '0',
            tvl: '0',
          },
          swap_count: 0,
          create_time: 0,
        }
      });

      return await Promise.all(poolsData);
    },
  });

  return { data, isLoading };
};

export default usePoolsData;
