import styles from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import CoinInput from "@/src/components/pages/add-liquidity-page/components/CoinInput/CoinInput";
import {clsx} from "clsx";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import useBalances from "@/src/hooks/useBalances/useBalances";
import useAssetBalance from "@/src/hooks/useAssetBalance";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {Dispatch, SetStateAction, useCallback, useRef, useState} from "react";
import {useDebounceCallback} from "usehooks-ts";
import useCheckEthBalance from "@/src/hooks/useCheckEthBalance/useCheckEthBalance";
import useFaucetLink from "@/src/hooks/useFaucetLink";
import {createPoolKey, openNewTab} from "@/src/utils/common";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import Info from "@/src/components/common/Info/Info";
import {CreatePoolPreviewData} from "./PreviewCreatePoolDialog";
import {buildPoolId} from "mira-dex-ts";
import {StablePoolTooltip, VolatilePoolTooltip} from "./CreatePoolTooltips";
import usePoolsMetadata from "@/src/hooks/usePoolsMetadata";
import useModal from "@/src/hooks/useModal/useModal";
import CoinsListModal from "@/src/components/common/Swap/components/CoinsListModal/CoinsListModal";
import {B256Address, BN, bn, formatUnits} from "fuels";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {useAssetPrice} from "@/src/hooks/useAssetPrice";
import SparkleIcon from "@/src/components/icons/Sparkle/SparkleIcon";
import Link from "next/link";
import useExchangeRateV2 from "@/src/hooks/useExchangeRate/useExchangeRateV2";
import ExchangeIcon from "@/src/components/icons/Exchange/ExchangeIcon";

type Props = {
  setPreviewData: Dispatch<SetStateAction<CreatePoolPreviewData | null>>;
};

const CreatePoolDialog = ({setPreviewData}: Props) => {
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
    // @ts-ignore
    existingPoolKey = createPoolKey(
      poolsMetadata?.[0]?.poolId ?? poolsMetadata?.[1]?.poolId,
    );
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
      <div className={styles.section}>
        <p>Selected pair</p>
        <div className={styles.sectionContent}>
          <div className={styles.coinPair}>
            {!oneOfAssetsIsNotSelected && (
              <CoinPair
                firstCoin={firstAssetId}
                secondCoin={secondAssetId}
                isStablePool={isStablePool}
              />
            )}
          </div>
          <div className={styles.poolStability}>
            <div
              className={clsx(
                styles.poolStabilityButton,
                !isStablePool && styles.poolStabilityButtonActive,
              )}
              onClick={() => handleStabilityChange(false)}
              role="button"
            >
              <div className={styles.poolStabilityButtonTitle}>
                <p>Volatile pool</p>
                <Info
                  tooltipText={VolatilePoolTooltip}
                  tooltipKey="volatilePool"
                />
              </div>
              <p>0.30% fee tier</p>
            </div>
            <button
              className={clsx(
                styles.poolStabilityButton,
                isStablePool && styles.poolStabilityButtonActive,
              )}
              onClick={() => handleStabilityChange(true)}
              role="button"
            >
              <div className={styles.poolStabilityButtonTitle}>
                <p>Stable pool</p>
                <Info tooltipText={StablePoolTooltip} tooltipKey="stablePool" />
              </div>
              <p>0.05% fee tier</p>
            </button>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <p>Deposit amount</p>
        <div className={styles.sectionContent}>
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
        <div className={styles.existingPoolBlock}>
          <div className={styles.sparkleIcon}>
            <SparkleIcon />
          </div>
          <p className={styles.existingPoolText}>This pool already exists</p>
          <Link
            href={`/liquidity/add/?pool=${existingPoolKey}`}
            className={styles.addLiquidityLink}
          >
            Add liquidity →
          </Link>
        </div>
      )}
      {!poolExists && !oneOfAssetsIsNotSelected && !oneOfAmountsIsEmpty && (
        <div className={styles.section}>
          <p>Starting price</p>
          <div className={styles.priceBlock} onClick={handleExchangeRateSwap}>
            <p>{exchangeRate}</p>
            <ExchangeIcon />
          </div>
          <p className={styles.priceWarning}>
            This is the price of the pool on inception. Always double check
            before deploying a pool.
          </p>
        </div>
      )}
      {!isConnected ? (
        <ActionButton
          variant="secondary"
          onClick={connect}
          loading={isConnecting}
        >
          Connect Wallet
        </ActionButton>
      ) : (
        <ActionButton disabled={buttonDisabled} onClick={handleButtonClick}>
          {buttonTitle}
        </ActionButton>
      )}
      <AssetsListModal title="Choose token">
        <CoinsListModal selectCoin={handleAssetSelection} balances={balances} />
      </AssetsListModal>
    </>
  );
};

export default CreatePoolDialog;
