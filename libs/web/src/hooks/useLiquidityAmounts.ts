import {useState, useCallback} from "react";
import {BN, bn} from "fuels";
import {useDebounceCallback} from "usehooks-ts";
import {PoolId} from "mira-dex-ts";
import {useAssetMetadata} from "@/src/hooks";

export const useLiquidityAmounts = (poolId: PoolId) => {
  const [firstAmount, setFirstAmount] = useState(new BN(0));
  const [firstAmountInput, setFirstAmountInput] = useState("");
  const [secondAmount, setSecondAmount] = useState(new BN(0));
  const [secondAmountInput, setSecondAmountInput] = useState("");
  const [activeAsset, setActiveAsset] = useState<string | null>(null);

  const asset0Metadata = useAssetMetadata(poolId[0].bits);
  const asset1Metadata = useAssetMetadata(poolId[1].bits);

  const debouncedSetFirstAmount = useDebounceCallback(setFirstAmount, 500);
  const debouncedSetSecondAmount = useDebounceCallback(setSecondAmount, 500);

  const isFirstToken = activeAsset === poolId[0].bits;

  const setAmount = useCallback(
    (coin: string) => {
      return (value: string) => {
        if (value === "") {
          debouncedSetFirstAmount(new BN(0));
          debouncedSetSecondAmount(new BN(0));
          setFirstAmountInput("");
          setSecondAmountInput("");
          setActiveAsset(coin);
          return;
        }

        if (coin === poolId[0].bits) {
          debouncedSetFirstAmount(
            bn.parseUnits(value, asset0Metadata.decimals)
          );
          setFirstAmountInput(value);
        } else {
          debouncedSetSecondAmount(
            bn.parseUnits(value, asset1Metadata.decimals)
          );
          setSecondAmountInput(value);
        }
        setActiveAsset(coin);
      };
    },
    [
      debouncedSetFirstAmount,
      debouncedSetSecondAmount,
      poolId,
      asset0Metadata,
      asset1Metadata,
    ]
  );

  const resetAmounts = useCallback(() => {
    setFirstAmount(new BN(0));
    setFirstAmountInput("");
    setSecondAmount(new BN(0));
    setSecondAmountInput("");
    setActiveAsset(null);
  }, []);

  const updateSecondAmount = useCallback((amount: BN, decimals: number) => {
    setSecondAmount(amount);
    setSecondAmountInput(amount.formatUnits(decimals));
  }, []);

  const updateFirstAmount = useCallback((amount: BN, decimals: number) => {
    setFirstAmount(amount);
    setFirstAmountInput(amount.formatUnits(decimals));
  }, []);

  return {
    firstAmount,
    firstAmountInput,
    secondAmount,
    secondAmountInput,
    activeAsset,
    isFirstToken,
    setAmount,
    resetAmounts,
    updateSecondAmount,
    updateFirstAmount,
    asset0Metadata,
    asset1Metadata,
  };
};
