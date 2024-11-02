import styles from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import CoinInput from "@/src/components/pages/add-liquidity-page/components/CoinInput/CoinInput";
import {clsx} from "clsx";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import useBalances from "@/src/hooks/useBalances/useBalances";
import useAssetBalance from "@/src/hooks/useAssetBalance";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {Dispatch, SetStateAction, useCallback, useRef, useState} from "react";
import {useDebounceCallback} from "usehooks-ts";
import useCheckEthBalance from "@/src/hooks/useCheckEthBalance/useCheckEthBalance";
import useFaucetLink from "@/src/hooks/useFaucetLink";
import {createPoolKey, getAssetDecimalsByAssetId, getAssetNameByAssetId, openNewTab} from "@/src/utils/common";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import Info from "@/src/components/common/Info/Info";
import {CreatePoolPreviewData} from "./PreviewCreatePoolDialog";
import {buildPoolId} from "mira-dex-ts";
import {StablePoolTooltip, VolatilePoolTooltip} from "./CreatePoolTooltips";
import usePoolsMetadata from "@/src/hooks/usePoolsMetadata";
import useModal from "@/src/hooks/useModal/useModal";
import CoinsListModal from "@/src/components/common/Swap/components/CoinsListModal/CoinsListModal";
import useUSDRate from "@/src/hooks/useUSDRate";
import {bn} from "fuels";
import SparkleIcon from "@/src/components/icons/Sparkle/SparkleIcon";
import Link from "next/link";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";
import useExchangeRateV2 from "@/src/hooks/useExchangeRate/useExchangeRateV2";
import ExchangeIcon from "@/src/components/icons/Exchange/ExchangeIcon";

type Props = {
  setPreviewData: Dispatch<SetStateAction<CreatePoolPreviewData | null>>;
}

const CreatePoolDialog = ({ setPreviewData }: Props) => {
  const [AssetsListModal, openAssetsListModal, closeAssetsListModal] = useModal();

  const { isConnected, isPending: isConnecting } = useIsConnected();
  const { connect } = useConnectUI();
  const { balances } = useBalances();

  const [firstAssetId, setFirstAssetId] = useState<string | null>(null);
  const [secondAssetId, setSecondAssetId] = useState<string | null>(null);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

  const firstAssetBalanceValue = useAssetBalance(balances, firstAssetId);
  const secondAssetBalanceValue = useAssetBalance(balances, secondAssetId);
  const firstAssetDecimals = getAssetDecimalsByAssetId(firstAssetId);
  const secondAssetDecimals = getAssetDecimalsByAssetId(secondAssetId);

  const [firstAmount, setFirstAmount] = useState('');
  const [firstAmountInput, setFirstAmountInput] = useState('');
  const [secondAmount, setSecondAmount] = useState('');
  const [secondAmountInput, setSecondAmountInput] = useState('');
  const [isStablePool, setIsStablePool] = useState(false);

  const activeAssetForAssetSelector = useRef<string | null>(null);

  // TODO: Change logic to work with asset ids only
  const firstCoin = getAssetNameByAssetId(firstAssetId);
  const secondCoin = getAssetNameByAssetId(secondAssetId);

  const pools = firstAssetId && secondAssetId ? [
    buildPoolId(firstAssetId, secondAssetId, true),
    buildPoolId(secondAssetId, firstAssetId, false),
  ] : undefined;
  const { poolsMetadata } = usePoolsMetadata(pools);
  const poolExists = Boolean(poolsMetadata) && (Boolean(poolsMetadata?.[0]) || Boolean(poolsMetadata?.[1]));
  const existingPoolStability = poolExists ? poolsMetadata?.[0]?.poolId[2] ?? poolsMetadata?.[1]?.poolId[2] : undefined;
  const isExistingOrNewPoolStable = existingPoolStability ?? isStablePool;
  let existingPoolKey = '';
  if (poolExists) {
    // @ts-ignore
    existingPoolKey = createPoolKey(poolsMetadata?.[0]?.poolId ?? poolsMetadata?.[1]?.poolId);
  }

  const debouncedSetFirstAmount = useDebounceCallback(setFirstAmount, 500);
  const debouncedSetSecondAmount = useDebounceCallback(setSecondAmount, 500);

  const handleStabilityChange = (isStable: boolean) => {
    if (poolExists) {
      return;
    }

    setIsStablePool(isStable);
  };

  const setAmount = useCallback((coin: CoinName) => {
    return (value: string) => {
      if (value === '') {
        debouncedSetFirstAmount('');
        debouncedSetSecondAmount('');
        setFirstAmountInput('');
        setSecondAmountInput('');
        return;
      }

      if (coin === firstCoin) {
        debouncedSetFirstAmount(value);
        setFirstAmountInput(value);
      } else {
        debouncedSetSecondAmount(value);
        setSecondAmountInput(value);
      }
    };
  }, [debouncedSetFirstAmount, debouncedSetSecondAmount, firstCoin]);

  const sufficientEthBalanceForFirstCoin = useCheckEthBalance({ coin: firstCoin, amount: firstAmount });
  const sufficientEthBalanceForSecondCoin = useCheckEthBalance({ coin: secondCoin, amount: secondAmount });
  const sufficientEthBalance = sufficientEthBalanceForFirstCoin && sufficientEthBalanceForSecondCoin;

  const faucetLink = useFaucetLink();
  const handleButtonClick = useCallback(() => {
    if (!sufficientEthBalance) {
      openNewTab(faucetLink);
      return;
    }

    setPreviewData({
      assets: [
        {
          coin: firstCoin,
          amount: firstAmount,
        },
        {
          coin: secondCoin,
          amount: secondAmount,
        }
      ],
      isStablePool,
    });
  }, [
    sufficientEthBalance,
    setPreviewData,
    firstCoin,
    firstAmount,
    secondCoin,
    secondAmount,
    isStablePool,
    faucetLink
  ]);

  const isValidNetwork = useCheckActiveNetwork();

  const insufficientFirstBalance = bn.parseUnits(firstAmount, firstAssetDecimals) > firstAssetBalanceValue;
  const insufficientSecondBalance = bn.parseUnits(secondAmount, secondAssetDecimals) > secondAssetBalanceValue;
  const insufficientBalance = insufficientFirstBalance || insufficientSecondBalance;
  const oneOfAssetsIsNotSelected = firstAssetId === null || secondAssetId === null;
  const oneOfAmountsIsEmpty = !firstAmount || !secondAmount;

  let buttonTitle = 'Preview creation';
  if (!isValidNetwork) {
    buttonTitle = 'Incorrect network';
  } else if (oneOfAssetsIsNotSelected) {
    buttonTitle = 'Choose assets';
  } else if (insufficientBalance) {
    buttonTitle = 'Insufficient balance';
  } else if (!sufficientEthBalance) {
    buttonTitle = 'Claim some ETH to pay for gas';
  }

  const buttonDisabled = !isValidNetwork || poolExists || oneOfAssetsIsNotSelected || oneOfAmountsIsEmpty || insufficientBalance;

  const handleAssetClick = useCallback((assetId: string | null) => {
    return () => {
      openAssetsListModal();
      activeAssetForAssetSelector.current = assetId;
    };
  }, [openAssetsListModal]);

  const handleAssetSelection = useCallback((asset: CoinName) => {
    const selectedAssetId = coinsConfig.get(asset)?.assetId!;

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
  }, [firstAssetId, secondAssetId, closeAssetsListModal]);

  const { ratesData } = useUSDRate(firstCoin, secondCoin);
  const firstAssetRate = ratesData?.find((item) => item.asset === firstCoin)?.rate;
  const secondAssetRate = ratesData?.find((item) => item.asset === secondCoin)?.rate;

  const exchangeRate = useExchangeRateV2({
    firstAssetId,
    secondAssetId,
    firstAssetAmount: firstAmount,
    secondAssetAmount: secondAmount,
    baseAssetId: activeAssetId,
  });

  const handleExchangeRateSwap = () => {
    setActiveAssetId(prevActiveAssetId => prevActiveAssetId === firstAssetId ? secondAssetId : firstAssetId);
  };

  return (
    <>
      <div className={styles.section}>
        <p>Selected pair</p>
        <div className={styles.sectionContent}>
          <div className={styles.coinPair}>
            {!oneOfAssetsIsNotSelected && (
              <CoinPair firstCoin={firstCoin} secondCoin={secondCoin} isStablePool={isStablePool}/>
            )}
          </div>
          <div className={styles.poolStability}>
            <div className={clsx(styles.poolStabilityButton, !isExistingOrNewPoolStable && styles.poolStabilityButtonActive, poolExists && styles.poolStabilityButtonDisabled)}
                 onClick={() => handleStabilityChange(false)}
                 role="button"
            >
              <div className={styles.poolStabilityButtonTitle}>
                <p>Volatile pool</p>
                <Info tooltipText={VolatilePoolTooltip} tooltipKey="volatilePool"/>
              </div>
              <p>0.30% fee tier</p>
            </div>
            <button className={clsx(styles.poolStabilityButton, isExistingOrNewPoolStable && styles.poolStabilityButtonActive, poolExists && styles.poolStabilityButtonDisabled)}
                    onClick={() => handleStabilityChange(true)}
                    role="button"
            >
              <div className={styles.poolStabilityButtonTitle}>
                <p>Stable pool</p>
                <Info tooltipText={StablePoolTooltip} tooltipKey="stablePool"/>
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
            setAmount={setAmount(firstCoin)}
            balance={firstAssetBalanceValue}
            usdRate={firstAssetRate}
            onAssetClick={handleAssetClick(firstAssetId)}
          />
          <CoinInput
            assetId={secondAssetId}
            value={secondAmountInput}
            loading={poolExists}
            setAmount={setAmount(secondCoin)}
            balance={secondAssetBalanceValue}
            usdRate={secondAssetRate}
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
          <Link href={`/liquidity/add/?pool=${existingPoolKey}`} className={styles.addLiquidityLink}>
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
            This is the price of the pool on inception. Always double check before deploying a pool.
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
        <CoinsListModal
          selectCoin={handleAssetSelection}
          balances={balances}
          verifiedAssetsOnly
        />
      </AssetsListModal>
    </>
  );
};

export default CreatePoolDialog;
