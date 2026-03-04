"use client";

import Link from "next/link";
import {useIsConnected} from "@fuels/react";
import {buildPoolId} from "mira-dex-ts";
import {FileText} from "lucide-react";
import {Button} from "@/meshwave-ui/Button";
import {DataTable, DataTableColumn} from "@/meshwave-ui/table";
import {
  usePositions,
  useV2Positions,
  type V2PositionSummary,
} from "@/src/hooks";
import {createPoolKey} from "@/src/utils/common";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionSizeCell from "./PositionSizeCell";
import AprCell from "./AprCell";
import {getPoolNavigationUrl} from "@/src/utils/poolNavigation";
import {Asset, PoolId} from "mira-dex-ts";
import {UiPoolType} from "@/src/utils/poolTypeDetection";
import {useMemo} from "react";
import {BN} from "fuels";

// Unified position type that can represent both V1 and V2 positions
export type UnifiedPosition = {
  poolId: PoolId | BN;
  lpAssetId?: string; // Only for V1
  isStable?: boolean; // Only for V1
  poolType: UiPoolType;
  token0Item: {
    token0Position: Asset;
    price: number;
  };
  token1Item: {
    token1Position: Asset;
    price: number;
  };
  // V2-specific fields
  isV2?: boolean;
  numberOfBins?: number;
};

// Helper to convert V2 position to unified format
function convertV2ToUnified(v2Position: V2PositionSummary): UnifiedPosition {
  // Create Asset-like structures for V2 positions
  const asset0: Asset = [
    {bits: v2Position.asset0.id} as any,
    v2Position.totalLiquidityX,
  ] as Asset;

  const asset1: Asset = [
    {bits: v2Position.asset1.id} as any,
    v2Position.totalLiquidityY,
  ] as Asset;

  return {
    poolId: v2Position.poolIdBN,
    poolType: "v2-concentrated",
    isV2: true,
    numberOfBins: v2Position.numberOfBins,
    token0Item: {
      token0Position: asset0,
      price: v2Position.asset0.price,
    },
    token1Item: {
      token1Position: asset1,
      price: v2Position.asset1.price,
    },
  };
}

export function Positions() {
  const {isConnected} = useIsConnected();
  const {data: v1Positions, isLoading: v1Loading} = usePositions();
  const {data: v2Positions, isLoading: v2Loading} = useV2Positions();

  // Combine V1 and V2 positions
  const allPositions = useMemo(() => {
    const positions: UnifiedPosition[] = [];

    // Add V1 positions
    if (v1Positions) {
      positions.push(...v1Positions);
    }

    // Add V2 positions (converted to unified format)
    if (v2Positions) {
      positions.push(...v2Positions.map(convertV2ToUnified));
    }

    return positions;
  }, [v1Positions, v2Positions]);

  const isLoading = v1Loading || v2Loading;

  if (isConnected && allPositions?.length === 0) {
    return (
      <section className="flex flex-col gap-6 w-full">
        <p className="text-xl leading-6">Your Positions</p>
        <div className="flex flex-col items-center gap-2 rounded-ten px-4 py-7  bg-background-grey-dark border-border-secondary border-[12px]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-11 w-11 flex items-center justify-center rounded-full text-white bg-black bg-cover">
              <FileText />
            </div>
            <p className="text-content-tertiary">
              Your liquidity will appear here
            </p>
          </div>
        </div>
      </section>
    );
  }

  const columns: DataTableColumn<UnifiedPosition>[] = [
    {
      key: "pools",
      header: "Pools",
      align: "left",
      render: (position) => {
        const assetIdA = position.token0Item.token0Position[0].bits;
        const assetIdB = position.token1Item.token1Position[0].bits;
        const isStablePool = position.isV2
          ? false
          : (position.isStable ?? false);
        const poolType = position.poolType;

        return (
          <div className="flex flex-col gap-1 min-w-[150px]">
            <CoinPair
              firstCoin={assetIdA}
              secondCoin={assetIdB}
              isStablePool={isStablePool}
              poolType={poolType}
              withPoolDetails={true}
            />
            {/* {position.isV2 && position.numberOfBins && (
              <span className="text-xs text-content-tertiary">
                {position.numberOfBins} bin
                {position.numberOfBins > 1 ? "s" : ""}
              </span>
            )} */}
          </div>
        );
      },
    },
    {
      key: "apr",
      header: "APR",
      align: "center",
      render: (position) => <AprCell position={position} />,
    },
    {
      key: "positionSize",
      header: "Position size",
      align: "center",
      render: (position) => <PositionSizeCell position={position} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (position) => {
        const assetIdA = position.token0Item.token0Position[0].bits;
        const assetIdB = position.token1Item.token1Position[0].bits;

        let path: string;
        if (position.isV2) {
          // For V2 positions, use the poolIdBN directly
          const poolKey = createPoolKey(position.poolId);
          path = getPoolNavigationUrl(position.poolId, "view");
        } else {
          // For V1 positions, build the poolId from assets and stability
          const isStablePool = position.isStable!;
          const poolId = buildPoolId(assetIdA, assetIdB, isStablePool);
          const poolKey = createPoolKey(poolId);
          path = getPoolNavigationUrl(poolId, "view");
        }

        return (
          <Link href={path} className="block w-full">
            <Button variant="outline" className="">
              Manage Position
            </Button>
          </Link>
        );
      },
    },
  ];

  return (
    <>
      {isConnected && (
        <section className="flex flex-col gap-6 w-full">
          <p className="text-xl leading-6">Your Positions</p>
          <DataTable
            data={allPositions || []}
            columns={columns}
            loading={isLoading}
            emptyMessage="Your liquidity will appear here"
          />
        </section>
      )}
    </>
  );
}
