import {Dispatch, SetStateAction, useCallback, useRef, useState} from "react";
import {B256Address, bn} from "fuels";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {ArrowLeftRight, Sparkle} from "lucide-react";
import {Button} from "@/meshwave-ui/Button";

import {clsx} from "clsx";
import Link from "next/link";
import {buildPoolId} from "mira-dex-ts";

import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import CoinInput from "@/src/components/pages/add-liquidity-page/components/CoinInput/CoinInput";
import {useDebounceCallback} from "usehooks-ts";
import {createPoolKey, openNewTab} from "@/src/utils/common";
import {Info, CoinsListModal } from "@/src/components/common";
import {StablePoolTooltip, VolatilePoolTooltip} from "./CreatePoolTooltips";
import {CreatePoolPreviewData} from "./PreviewCreatePoolDialog";

import {useAssetBalance, useExchangeRateV2, useFaucetLink, useModal, usePoolsMetadata, useCheckEthBalance, useAssetPrice, useAssetMetadata, useCheckActiveNetwork, useBalances} from "@/src/hooks";

export function CreatePoolDialog({setPreviewData}: {
  setPreviewData: Dispatch<SetStateAction<CreatePoolPreviewData | null>>;
}) {
  const [AssetsListModal, openAssetsListModal, closeAssetsListModal] = useModal();

  const {isConnected, isPending: isConnecting} = useIsConnected();
  const {connect} = useConnectUI();
  const {balances} = useBalances();

  const [firstAssetId, setFirstAssetId] = useState<string | null>(null);
  const [secondAssetId, setSecondAssetId] = useState<string | null>(null);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

  const firstAssetBalanceValue = useAssetBalance(balances, firstAssetId);
  const secondAssetBalanceValue = useAssetBalance(balances, secondAssetId);

  const [firstAmount, setFirstAmount] = useState("");
  const [firstAmountInput, setFirstAmountInput] = useState("");
  const [secondAmount, setSecondAmount] = useState("");
  const [secondAmountInput, setSecondAmountInput] = useState("");
  const [activeAsset, setActiveAsset] = useState<B256Address | null>(null);
  const [isStablePool, setIsStablePool] = useState(false);

  const activeAssetForAssetSelector = useRef<string | null>(null);

  const firstAssetMetadata = useAssetMetadata(firstAssetId);
  const secondAssetMetadata = useAssetMetadata(secondAssetId);

  const pools =
    firstAssetId && secondAssetId
      ? [buildPoolId(firstAssetId, secondAssetId, isStablePool)]
      : undefined;
  const {poolsMetadata} = usePoolsMetadata(pools);
  const poolExists = Boolean(poolsMetadata && poolsMetadata?.[0]);
  let existingPoolKey = "";
  if (poolExists) {
    const poolId = poolsMetadata?.[0]?.poolId || poolsMetadata?.[1]?.poolId;
    if (poolId) {
      existingPoolKey = createPoolKey(poolId);
    }
  }

  const debouncedSetFirstAmount = useDebounceCallback(setFirstAmount, 500);
  const debouncedSetSecondAmount = useDebounceCallback(setSecondAmount, 500);

  const handleStabilityChange = (isStable: boolean) =>
    setIsStablePool(isStable);

  const setAmount = useCallback(
    (coin: B256Address | null) => {
      if (!coin) {
        return () => void 0;
      }

      return (value: string) => {
        if (coin === firstAssetId) {
          debouncedSetFirstAmount(value);
          setFirstAmountInput(value);
        } else {
          debouncedSetSecondAmount(value);
          setSecondAmountInput(value);
        }
        setActiveAsset(coin);
      };
    },
    [debouncedSetFirstAmount, debouncedSetSecondAmount, firstAssetId],
  );

  const sufficientEthBalanceForFirstCoin = useCheckEthBalance({
    assetId: firstAssetId,
    amount: firstAmount,
  });
  const sufficientEthBalanceForSecondCoin = useCheckEthBalance({
    assetId: secondAssetId,
    amount: secondAmount,
  });
  const sufficientEthBalance =
    sufficientEthBalanceForFirstCoin && sufficientEthBalanceForSecondCoin;

  const faucetLink = useFaucetLink();
  const handleButtonClick = useCallback(() => {
    if (!sufficientEthBalance) {
      openNewTab(faucetLink);
      return;
    }

    setPreviewData(
      firstAssetId && secondAssetId
        ? {
            assets: [
              {
                assetId: firstAssetId,
                amount: firstAmount,
              },
              {
                assetId: secondAssetId,
                amount: secondAmount,
              },
            ],
            isStablePool,
          }
        : null,
    );
  }, [
    sufficientEthBalance,
    setPreviewData,
    firstAssetId,
    firstAmount,
    secondAssetId,
    secondAmount,
    isStablePool,
    faucetLink,
  ]);

  const isValidNetwork = useCheckActiveNetwork();

  const insufficientFirstBalance = bn
    .parseUnits(firstAmount, firstAssetMetadata.decimals)
    .gt(firstAssetBalanceValue);
  const insufficientSecondBalance = bn
    .parseUnits(secondAmount, secondAssetMetadata.decimals)
    .gt(secondAssetBalanceValue);
  const insufficientBalance =
    insufficientFirstBalance || insufficientSecondBalance;
  const oneOfAssetsIsNotSelected =
    firstAssetId === null || secondAssetId === null;
  const oneOfAmountsIsEmpty =
    !firstAmount ||
    !secondAmount ||
    firstAmount === "0" ||
    secondAmount === "0";

  let buttonTitle = "Preview creation";
  if (!isValidNetwork) {
    buttonTitle = "Incorrect network";
  } else if (oneOfAssetsIsNotSelected) {
    buttonTitle = "Choose assets";
  } else if (insufficientBalance) {
    buttonTitle = "Insufficient balance";
  } else if (!sufficientEthBalance) {
    buttonTitle = "Claim some ETH to pay for gas";
  } else if (oneOfAmountsIsEmpty) {
    buttonTitle = "Enter asset amounts";
  }

  const buttonDisabled =
    !isValidNetwork ||
    poolExists ||
    oneOfAssetsIsNotSelected ||
    oneOfAmountsIsEmpty ||
    insufficientBalance;

  const handleAssetClick = useCallback(
    (assetId: string | null) => {
      return () => {
        openAssetsListModal();
        activeAssetForAssetSelector.current = assetId;
      };
    },
    [openAssetsListModal],
  );

  const handleAssetSelection = useCallback(
    (selectedAssetId: B256Address | null) => {
      if (activeAssetForAssetSelector.current === firstAssetId) {
        if (selectedAssetId === secondAssetId) {
          setSecondAssetId(firstAssetId);
        }
        setFirstAssetId(selectedAssetId);
      } else {
        if (selectedAssetId === firstAssetId) {
          setFirstAssetId(secondAssetId);
        }
        setSecondAssetId(selectedAssetId);
      }

      closeAssetsListModal();
    },
    [firstAssetId, secondAssetId, closeAssetsListModal],
  );

  const firstAssetPrice = useAssetPrice(firstAssetId);
  const secondAssetPrice = useAssetPrice(secondAssetId);

  const exchangeRate = useExchangeRateV2({
    firstAssetId,
    secondAssetId,
    firstAssetAmount: firstAmount,
    secondAssetAmount: secondAmount,
    baseAssetId: activeAssetId,
  });

  const handleExchangeRateSwap = () => {
    setActiveAssetId((prevActiveAssetId) =>
      prevActiveAssetId === firstAssetId ? secondAssetId : firstAssetId,
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="text-base text-content-primary">Selected pair</p>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
            {!oneOfAssetsIsNotSelected && (
              <CoinPair
                firstCoin={firstAssetId}
                secondCoin={secondAssetId}
                isStablePool={isStablePool}
              />
            )}
          </div>
          <div className="flex w-full gap-2">
            <div
              className={clsx(
                "flex flex-col items-start w-full rounded-md px-3 py-3 gap-2 bg-background-secondary text-content-dimmed-light cursor-pointer",
                !isStablePool &&
                  "text-content-primary border-accent-primary border",
              )}
              onClick={() => handleStabilityChange(false)}
              role="button"
            >
              <div className="flex w-full">
                <p className="flex-1 text-left">Volatile pool</p>
                <Info
                  tooltipText={VolatilePoolTooltip}
                  tooltipKey="volatilePool"
                />
              </div>
              <p>0.30% fee tier</p>
            </div>

            <button
              className={clsx(
                "flex flex-col items-start w-full rounded-md px-3 py-3 gap-2 bg-background-secondary text-content-dimmed-light cursor-pointer",
                isStablePool &&
                  "text-content-primary border-accent-primary border",
              )}
              onClick={() => handleStabilityChange(true)}
              role="button"
            >
              <div className="flex w-full">
                <p className="flex-1 text-left">Stable pool</p>
                <Info tooltipText={StablePoolTooltip} tooltipKey="stablePool" />
              </div>
              <p>0.05% fee tier</p>
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-base text-content-primary">Deposit amount</p>
        <div className="flex flex-col gap-3">
          <CoinInput
            assetId={firstAssetId}
            value={firstAmountInput}
            loading={poolExists}
            setAmount={setAmount(firstAssetId)}
            balance={firstAssetBalanceValue}
            usdRate={firstAssetPrice.price ?? undefined}
            onAssetClick={handleAssetClick(firstAssetId)}
          />
          <CoinInput
            assetId={secondAssetId}
            value={secondAmountInput}
            loading={poolExists}
            setAmount={setAmount(secondAssetId)}
            balance={secondAssetBalanceValue}
            usdRate={secondAssetPrice.price ?? undefined}
            onAssetClick={handleAssetClick(secondAssetId)}
          />
        </div>
      </div>

      {poolExists && (
        <div className="flex items-center gap-2 p-3 rounded-[10px] bg-gradient-to-r from-[#5872fc] via-[#6142ba] to-[#c41cff]">
          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-content-dimmed-dark">
            <Sparkle className="size-3" />
          </div>
          <p className="flex-1 text-sm text-white">This pool already exists</p>
          <Link
            href={`/liquidity/add/?pool=${existingPoolKey}`}
            className="underline hover:text-content-secondary"
          >
            Add liquidity →
          </Link>
        </div>
      )}
      {!poolExists && !oneOfAssetsIsNotSelected && !oneOfAmountsIsEmpty && (
        <div className="flex flex-col gap-4">
          <p className="text-base text-content-primary">Starting price</p>
          <div
            className="flex justify-between items-center px-4 py-3 rounded-md bg-background-grey-darker cursor-pointer"
            onClick={handleExchangeRateSwap}
          >
            <p className="text-sm font-medium">{exchangeRate}</p>
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <p className="text-sm text-[#ffb800] leading-[17px]">
            This is the price of the pool on inception. Always double check
            before deploying a pool.
          </p>
        </div>
      )}
      {!isConnected ? (
        <Button variant="secondary" onClick={connect} loading={isConnecting}>
          Connect Wallet
        </Button>
      ) : (
        <Button disabled={buttonDisabled} onClick={handleButtonClick}>
          {buttonTitle}
        </Button>
      )}
      <AssetsListModal title="Choose token">
        <CoinsListModal selectCoin={handleAssetSelection} balances={balances} />
      </AssetsListModal>
    </>
  );
}
