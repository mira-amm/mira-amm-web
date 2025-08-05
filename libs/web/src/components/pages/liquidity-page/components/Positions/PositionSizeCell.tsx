import {Position} from "@/src/hooks/usePositions";
import {formatUnits} from "fuels";
import {useAssetMetadata} from "@/src/hooks";

const PositionSizeCell = ({position}: {position: Position}) => {
  const assetIdA = position.token0Item.token0Position[0].bits;
  const assetIdB = position.token1Item.token1Position[0].bits;
  const amountA = position.token0Item.token0Position[1].toString();
  const amountB = position.token1Item.token1Position[1].toString();
  const priceA = position.token0Item.price;
  const priceB = position.token1Item.price;

  const assetAMetadata = useAssetMetadata(assetIdA);
  const assetBMetadata = useAssetMetadata(assetIdB);

  const coinAAmount = formatUnits(amountA, assetAMetadata.decimals);
  const coinBAmount = formatUnits(amountB, assetBMetadata.decimals);
  const size =
    parseFloat(coinAAmount) * priceA + parseFloat(coinBAmount) * priceB;

  return (
    <div className="text-center text-base font-alt">
      {size ? `$${size.toFixed(2)}` : "checking..."}
    </div>
  );
};

export default PositionSizeCell;
