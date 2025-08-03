import React, {
  ChangeEvent,
  Dispatch,
  memo,
  MouseEvent,
  TouchEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {useDebounceCallback, useDocumentTitle} from "usehooks-ts";
import {useAssetMetadata} from "@/src/hooks";
import {B256Address} from "fuels";
import {Info} from "lucide-react";
import {Button} from "@/meshwave-ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/meshwave-ui/table";

type Props = {
  coinA: B256Address;
  coinB: B256Address;
  isStablePool: boolean;
  currentCoinAValue: string;
  currentCoinBValue: string;
  coinAValueToWithdraw: string;
  coinBValueToWithdraw: string;
  liquidityValue: number;
  setLiquidityValue: Dispatch<SetStateAction<number>>;
  closeModal: VoidFunction;
  handleRemoveLiquidity: VoidFunction;
  isValidNetwork: boolean;
  isLoading: boolean;
};

const RemoveLiquidityModalContent = ({
  coinA,
  coinB,
  isStablePool,
  currentCoinAValue,
  currentCoinBValue,
  coinAValueToWithdraw,
  coinBValueToWithdraw,
  closeModal,
  liquidityValue,
  setLiquidityValue,
  handleRemoveLiquidity,
  isValidNetwork,
  isLoading,
}: Props) => {
  const [displayValue, setDisplayValue] = useState(liquidityValue);
  const coinAMetadata = useAssetMetadata(coinA);
  const coinBMetadata = useAssetMetadata(coinB);

  // HACK: This is a bit of an ugly way to set document titles
  useDocumentTitle(
    `Remove Liquidity:  ${coinAMetadata.symbol}/${coinBMetadata.symbol}`
  );

  const sliderRef = useRef<HTMLInputElement>(null);
  const debouncedSetValue = useDebounceCallback(setLiquidityValue, 500);

  const handleMouseUp = (
    e: MouseEvent<HTMLInputElement> | TouchEvent<HTMLInputElement>
  ) => {
    // @ts-ignore
    debouncedSetValue(Number(e.target.value));
  };

  useEffect(() => {
    if (sliderRef.current) {
      document.documentElement.style.setProperty(
        "--value",
        `${sliderRef.current.value}%`
      );
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(Number(e.target.value));
    document.documentElement.style.setProperty("--value", `${e.target.value}%`);
  };

  const handleMax = () => {
    debouncedSetValue(100);
    document.documentElement.style.setProperty("--value", "100%");
  };

  const withdrawalDisabled = !isValidNetwork;
  const buttonTitle = withdrawalDisabled ? "Incorrect network" : "Confirm";

  return (
    <div className="flex flex-col gap-4">
      <CoinPair
        firstCoin={coinA}
        secondCoin={coinB}
        isStablePool={isStablePool}
      />

      <div className="flex justify-between items-center">
        <p className=" text-2xl leading-[28px]">{displayValue}%</p>
        <button
          className="uppercase text-[12px] leading-4 px-2 py-1 border border-accent-primary text-accent-primary rounded hover:opacity-80 transition-opacity"
          onClick={handleMax}
        >
          Max
        </button>
      </div>

      <input
        type="range"
        className="remove-liquidity-slider"
        min={0}
        max={100}
        defaultValue={liquidityValue}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        onChange={handleChange}
        ref={sliderRef}
      />

      <Table
        className="text-[14px] leading-4 text-content-tertiary"
        tableParentClassName="border-0 p-2 dark:p-0 rounded-lg"
      >
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead className="py-4">{coinAMetadata.symbol}</TableHead>
            <TableHead className="text-right py-4">
              {coinBMetadata.symbol}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow clasName="border-none">
            <TableCell className="py-4">Current position</TableCell>
            <TableCell className="py-4">{currentCoinAValue}</TableCell>
            <TableCell className="text-right py-4">
              {currentCoinBValue}
            </TableCell>
          </TableRow>
          <TableRow className=" text-content-primary border-t border-background-grey-dark">
            <TableCell className="py-4">Remove</TableCell>
            <TableCell className="py-4">{coinAValueToWithdraw}</TableCell>
            <TableCell className="py-4 text-right">
              {coinBValueToWithdraw}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-accent-alert dark:text-accent-primary">
          <Info /> Pay attention
        </p>
        <p className="text-sm leading-4 text-accent-alert dark:text-content-tertiary">
          This based on the current price of the pool. Your fees earned will
          always increase, but the principal amount may change with the price of
          the pool
        </p>
      </div>

      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          onClick={closeModal}
          disabled={isLoading}
          block
        >
          Cancel
        </Button>
        <Button
          onClick={handleRemoveLiquidity}
          disabled={withdrawalDisabled}
          loading={isLoading}
          block
        >
          {buttonTitle}
        </Button>
      </div>
    </div>
  );
};

export default memo(RemoveLiquidityModalContent);
