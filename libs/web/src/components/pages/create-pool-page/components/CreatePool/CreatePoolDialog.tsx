import {
  Dispatch,
  SetStateAction,
  useCallback,
  useRef,
  useState,
  useMemo,
} from "react";
import {B256Address, bn} from "fuels";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {ArrowLeftRight, Sparkle} from "lucide-react";
import {Button, ButtonGroup} from "@/meshwave-ui/Button";

import Link from "next/link";
import {buildPoolId} from "mira-dex-ts";

type V2PoolConfig = {
  binStep: number;
  baseFactor: number;
};

// V2 Concentrated Liquidity Pool Configuration
const V2_POOL_CONFIGS: V2PoolConfig[] = [
  {binStep: 10, baseFactor: 1000}, // base fee 0.1%
  {binStep: 25, baseFactor: 1000}, // base fee 0.25%
  {binStep: 50, baseFactor: 800}, // base fee 0.4%
  {binStep: 100, baseFactor: 800}, // base fee 0.8%
] as const;

const DEFAULT_V2_CONFIG = V2_POOL_CONFIGS[1]; // Default to 0.25%

// Helper function to calculate base fee percentage
const calculateBaseFee = (binStep: number, baseFactor: number): string => {
  const fee = (binStep * baseFactor) / 1000000;
  return `${fee}%`;
};

import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import CoinInput from "@/src/components/pages/add-liquidity-page/components/CoinInput/CoinInput";
import {useDebounceCallback} from "usehooks-ts";
import {createPoolKey, openNewTab} from "@/src/utils/common";
import {Info, CoinsListModal} from "@/src/components/common";
import {
  StablePoolTooltip,
  VolatilePoolTooltip,
  ConcentratedLiquidityTooltip,
} from "./CreatePoolTooltips";
import {CreatePoolPreviewData} from "./PreviewCreatePoolDialog";

import {
  useAssetBalance,
  useExchangeRateV2,
  useFaucetLink,
  useModal,
  usePoolsMetadata,
  useCheckEthBalance,
  useAssetPrice,
  useAssetMetadata,
  useCheckActiveNetwork,
  useBalances,
} from "@/src/hooks";
import {cn} from "@/src/utils/cn";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";
import {getUiPoolTypeFromPoolId} from "@/src/utils/poolTypeDetection";
import {Input} from "@/meshwave-ui/input";
import {Alert, AlertDescription} from "@/meshwave-ui/alert";
import {sanitizeNumericInput} from "../../../add-liquidity-page/components/AddLiquidity/V2LiquidityConfig";
import {
  Select as SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/meshwave-ui/select";

export function CreatePoolDialog({
  setPreviewData,
}: {
  setPreviewData: Dispatch<SetStateAction<CreatePoolPreviewData | null>>;
}) {
  const [AssetsListModal, openAssetsListModal, closeAssetsListModal] =
    useModal();

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
  const [poolType, setPoolType] = useState<
    "volatile" | "stable" | "concentrated"
  >("volatile");
  const isStablePool = poolType === "stable";
  const [v2Config, setV2Config] = useState({
    binStep: DEFAULT_V2_CONFIG.binStep,
    baseFactor: DEFAULT_V2_CONFIG.baseFactor,
  });
  const [activePriceInput, setActivePriceInput] = useState("");

  const activeAssetForAssetSelector = useRef<string | null>(null);

  const firstAssetMetadata = useAssetMetadata(firstAssetId);
  const secondAssetMetadata = useAssetMetadata(secondAssetId);

  const pools =
    firstAssetId && secondAssetId && poolType !== "concentrated"
      ? [buildPoolId(firstAssetId, secondAssetId, poolType === "stable")]
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

  const handlePoolTypeChange = (type: "volatile" | "stable" | "concentrated") =>
    setPoolType(type);

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
    [debouncedSetFirstAmount, debouncedSetSecondAmount, firstAssetId]
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
            poolType,
            v2Config: poolType === "concentrated" ? v2Config : undefined,
          }
        : null
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
    [openAssetsListModal]
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
    [firstAssetId, secondAssetId, closeAssetsListModal]
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
      prevActiveAssetId === firstAssetId ? secondAssetId : firstAssetId
    );
  };

  const rebrandEnabled = getIsRebrandEnabled();

  // Derived labels and market price for concentrated pool UI
  const baseIsFirst = activeAssetId ? activeAssetId === firstAssetId : true;
  const baseSymbol = baseIsFirst
    ? firstAssetMetadata.symbol
    : secondAssetMetadata.symbol;
  const quoteSymbol = baseIsFirst
    ? secondAssetMetadata.symbol
    : firstAssetMetadata.symbol;
  const marketPrice = useMemo(() => {
    const p1 = firstAssetPrice.price;
    const p2 = secondAssetPrice.price;
    if (typeof p1 !== "number" || typeof p2 !== "number") return null;
    if (!Number.isFinite(p1) || !Number.isFinite(p2) || p1 <= 0 || p2 <= 0) {
      return null;
    }
    return baseIsFirst ? p1 / p2 : p2 / p1;
  }, [firstAssetPrice.price, secondAssetPrice.price, baseIsFirst]);
  const activePriceNumber = parseFloat(activePriceInput.replace(",", "."));
  const canWarn =
    Number.isFinite(activePriceNumber) &&
    typeof marketPrice === "number" &&
    marketPrice > 0 &&
    activePriceNumber > 0;
  const priceDeviation = canWarn
    ? (Math.abs(activePriceNumber - (marketPrice as number)) /
        (marketPrice as number)) *
      100
    : undefined;

  const hasBothMarketPrices =
    typeof firstAssetPrice.price === "number" &&
    Number.isFinite(firstAssetPrice.price) &&
    firstAssetPrice.price > 0 &&
    typeof secondAssetPrice.price === "number" &&
    Number.isFinite(secondAssetPrice.price) &&
    secondAssetPrice.price > 0;

  const handleBinStepChange = (selectedBinStep: number) => {
    const config = V2_POOL_CONFIGS.find((c) => c.binStep === selectedBinStep);
    if (config) {
      setV2Config({
        binStep: config.binStep,
        baseFactor: config.baseFactor,
      });
    }
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
                isStablePool={poolType === "stable"}
                poolType={
                  poolsMetadata?.[0]?.poolId
                    ? getUiPoolTypeFromPoolId(poolsMetadata[0].poolId)
                    : undefined
                }
                withPoolDetails
              />
            )}
          </div>
          <div className="flex flex-col w-full gap-2">
            <div
              className={cn(
                "flex flex-col items-start w-full rounded-md px-3 py-3 gap-2 bg-background-secondary text-content-dimmed-light cursor-pointer border border-background-grey-light hover:border-content-primary",
                poolType === "volatile" && "text-content-primary border",
                poolType === "volatile" &&
                  "border-background-primary dark:border-content-tertiary"
              )}
              onClick={() => handlePoolTypeChange("volatile")}
              role="button"
            >
              <div className="flex w-full">
                <p className="flex-1 text-left">Volatile Pool (v1)</p>
                <Info tooltipText={VolatilePoolTooltip} />
              </div>
              <p>
                <span className="font-alt">0.30%</span> fee tier
              </p>
            </div>

            <div
              className={cn(
                "flex flex-col items-start w-full rounded-md px-3 py-3 gap-2 bg-background-secondary text-content-dimmed-light cursor-pointer border border-background-grey-light hover:border-content-primary",
                poolType === "stable" && "text-content-primary border",
                poolType === "stable" &&
                  "border-background-primary dark:border-content-tertiary"
              )}
              onClick={() => handlePoolTypeChange("stable")}
              role="button"
            >
              <div className="flex w-full">
                <p className="flex-1 text-left">Stable Pool (v1)</p>
                <Info tooltipText={StablePoolTooltip} />
              </div>
              <p>
                <span className="font-alt">0.05%</span> fee tier
              </p>
            </div>

            <div
              className={cn(
                "flex flex-col items-start w-full rounded-md px-3 py-3 gap-2 bg-background-secondary text-content-dimmed-light cursor-pointer border border-background-grey-light hover:border-content-primary",
                poolType === "concentrated" && "text-content-primary border",
                poolType === "concentrated" &&
                  "border-background-primary dark:border-content-tertiary"
              )}
              onClick={() => handlePoolTypeChange("concentrated")}
              role="button"
            >
              <div className="flex w-full">
                <p className="flex-1 text-left">
                  Concentrated Liquidity Pool (v2)
                </p>
                <Info tooltipText={ConcentratedLiquidityTooltip} />
              </div>
              <p>Variable fee tier</p>
            </div>
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

      {poolType === "concentrated" && (
        <div className="flex flex-col gap-4">
          <p className="text-base">Select Bin Step</p>
          {/* Mobile: dropdown */}
          <div className="md:hidden">
            <SelectRoot
              value={String(v2Config.binStep)}
              onValueChange={(value) => handleBinStepChange(Number(value))}
            >
              <SelectTrigger>{`${v2Config.binStep / 100}%`}</SelectTrigger>
              <SelectContent className="bg-background-secondary text-content-primary border border-background-grey-light shadow-md">
                {V2_POOL_CONFIGS.map((config) => (
                  <SelectItem
                    key={config.binStep}
                    value={String(config.binStep)}
                    className="focus:bg-background-grey-light focus:text-content-primary"
                  >
                    <span className="flex flex-col items-start gap-1">
                      <span className="text-sm leading-none">{`${config.binStep / 100}%`}</span>
                      <span className="text-xs whitespace-nowrap leading-none text-content-tertiary">
                        {`Fee: ${calculateBaseFee(config.binStep, config.baseFactor)}`}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>

          {/* Desktop: button group */}
          <div className="hidden md:block">
            <ButtonGroup
              items={V2_POOL_CONFIGS.map((config) => ({
                value: config.binStep,
                label: `${config.binStep / 100}%`,
              }))}
              value={v2Config.binStep}
              onChange={handleBinStepChange}
              buttonClassName="h-full px-3 py-2 min-w-0"
              renderItem={(item) => {
                const config = V2_POOL_CONFIGS.find(
                  (c) => c.binStep === item.value
                );
                return (
                  <div className="flex flex-col items-center justify-center gap-1 p-2 min-w-0">
                    <span className="text-sm leading-none">{item.label}</span>
                    <span className="text-xs whitespace-nowrap leading-none">
                      Fee:{" "}
                      {config
                        ? calculateBaseFee(config.binStep, config.baseFactor)
                        : item.label}
                    </span>
                  </div>
                );
              }}
            />
          </div>

          {/* Active price input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span>Enter active price</span>
              {Boolean(firstAssetId && secondAssetId) && (
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={handleExchangeRateSwap}
                >
                  <span className="text-content-tertiary text-xs">
                    {`Current price: ${exchangeRate ?? "—"}`}
                  </span>
                  <ArrowLeftRight className="w-4 h-4 text-content-tertiary" />
                </div>
              )}
            </div>

            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]*"
                placeholder="1200"
                value={activePriceInput}
                onChange={(e) =>
                  setActivePriceInput(sanitizeNumericInput(e.target.value))
                }
                className="font-alt pr-28"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {baseSymbol && quoteSymbol
                  ? `${baseSymbol} per ${quoteSymbol}`
                  : "—"}
              </span>
            </div>

            {Boolean(canWarn) && (
              <Alert variant="warning">
                <AlertDescription>
                  The active price is set to{" "}
                  {activePriceNumber.toLocaleString()} {baseSymbol} per{" "}
                  {quoteSymbol}, while the current market price is{" "}
                  {Number(marketPrice).toLocaleString()} {baseSymbol} per{" "}
                  {quoteSymbol}. This is a deviation of{" "}
                  {(priceDeviation ?? 0).toFixed(2)}%. Please review the price
                  settings to ensure accuracy.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      {poolExists && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-background-primary">
          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-content-dimmed-dark">
            <Sparkle className="size-3 text-white" />
          </div>
          <p className="flex-1 text-sm text-white">This pool already exists</p>
          <Link
            href={`/liquidity/add/?pool=${existingPoolKey}`}
            className="underline underline-offset-2 text-sm text-white"
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
            <p className="text-sm ">{exchangeRate}</p>
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <Alert variant="warning">
            <AlertDescription>
              {hasBothMarketPrices
                ? "This is the price of the pool on inception. Always double check before deploying a pool."
                : "This is the price of the pool on inception, make sure it reflects current market price before creating the pool to avoid losses."}
            </AlertDescription>
          </Alert>
        </div>
      )}
      {!isConnected ? (
        <Button onClick={connect} disabled={isConnecting} size="2xl">
          Connect Wallet
        </Button>
      ) : (
        <Button
          disabled={buttonDisabled}
          onClick={handleButtonClick}
          size="2xl"
        >
          {buttonTitle}
        </Button>
      )}
      <AssetsListModal title="Choose token">
        <CoinsListModal selectCoin={handleAssetSelection} balances={balances} />
      </AssetsListModal>
    </>
  );
}
