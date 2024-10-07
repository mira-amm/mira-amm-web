import styles from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import CoinInput from "@/src/components/pages/add-liquidity-page/components/CoinInput/CoinInput";
import {clsx} from "clsx";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import useBalances from "@/src/hooks/useBalances/useBalances";
import useAssetBalance from "@/src/hooks/useAssetBalance";
import {useConnectUI, useIsConnected} from "@fuels/react";
import usePreviewAddLiquidity from "@/src/hooks/usePreviewAddLiquidity";
import {Dispatch, SetStateAction, useCallback, useEffect, useState} from "react";
import {useDebounceCallback} from "usehooks-ts";
import useCheckEthBalance from "@/src/hooks/useCheckEthBalance/useCheckEthBalance";
import useFaucetLink from "@/src/hooks/useFaucetLink";
import {
  getAssetNamesFromPoolId,
  openNewTab
} from "@/src/utils/common";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import usePoolAPR from "@/src/hooks/usePoolAPR";
import {DefaultLocale} from "@/src/utils/constants";
import Info from "@/src/components/common/Info/Info";
import {
  AddLiquidityPreviewData
} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";
import {PoolId} from "mira-dex-ts";
import {
  APRTooltip, StablePoolTooltip,
  VolatilePoolTooltip
} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/addLiquidityTooltips";
import useUSDRate from "@/src/hooks/useUSDRate";

type Props = {
  poolId: PoolId;
  setPreviewData: Dispatch<SetStateAction<AddLiquidityPreviewData | null>>;
  newPool?: boolean;
}

const AddLiquidityDialog = ({ poolId, setPreviewData, newPool }: Props) => {
  const { isConnected, isPending: isConnecting } = useIsConnected();
  const { connect } = useConnectUI();
  const { balances } = useBalances();

  const { assetBalanceValue: firstAssetBalanceValue } = useAssetBalance(balances, poolId[0].bits);
  const { assetBalanceValue: secondAssetBalanceValue } = useAssetBalance(balances, poolId[1].bits);

  const [firstAmount, setFirstAmount] = useState('');
  const [firstAmountInput, setFirstAmountInput] = useState('');
  const [secondAmount, setSecondAmount] = useState('');
  const [secondAmountInput, setSecondAmountInput] = useState('');
  const [activeAssetName, setActiveAssetName] = useState<CoinName | null>(null);
  const [isStablePool, setIsStablePool] = useState(poolId[2]);

  // TODO: Change logic to work with asset ids only
  const { firstAssetName: firstCoin, secondAssetName: secondCoin } = getAssetNamesFromPoolId(poolId);
  const isFirstToken = activeAssetName === firstCoin;

  const { data, isFetching } = usePreviewAddLiquidity({
    firstCoin,
    secondCoin,
    amountString: isFirstToken ? firstAmount : secondAmount,
    isFirstToken,
    isStablePool,
  });

  const { apr } = usePoolAPR(poolId);
  const aprValue = apr
    ? parseFloat(apr).toLocaleString(DefaultLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  const debouncedSetFirstAmount = useDebounceCallback(setFirstAmount, 500);
  const debouncedSetSecondAmount = useDebounceCallback(setSecondAmount, 500);

  useEffect(() => {
    if (data) {
      const anotherToken = isFirstToken ? secondCoin : firstCoin;
      const anotherTokenDecimals = coinsConfig.get(anotherToken)?.decimals!;
      const anotherTokenValue = data[1].toNumber() / 10 ** anotherTokenDecimals;

      if (isFirstToken) {
        setSecondAmount(anotherTokenValue.toFixed(anotherTokenDecimals));
        setSecondAmountInput(anotherTokenValue.toFixed(anotherTokenDecimals));
      } else {
        setFirstAmount(anotherTokenValue.toFixed(anotherTokenDecimals));
        setFirstAmountInput(anotherTokenValue.toFixed(anotherTokenDecimals));
      }
    }
  }, [data]);

  const handleStabilityChange = (isStable: boolean) => {
    if (!newPool) {
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
        setActiveAssetName(coin);
        return;
      }

      if (coin === firstCoin) {
        debouncedSetFirstAmount(value);
        setFirstAmountInput(value);
      } else {
        debouncedSetSecondAmount(value);
        setSecondAmountInput(value);
      }
      setActiveAssetName(coin);
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

  const insufficientFirstBalance = parseFloat(firstAmount) > firstAssetBalanceValue;
  const insufficientSecondBalance = parseFloat(secondAmount) > secondAssetBalanceValue;
  const insufficientBalance = insufficientFirstBalance || insufficientSecondBalance;

  let buttonTitle = 'Preview';
  if (!isValidNetwork) {
    buttonTitle = 'Incorrect network';
  } else if (insufficientBalance) {
    buttonTitle = 'Insufficient balance';
  } else if (!sufficientEthBalance) {
    buttonTitle = 'Claim some ETH to pay for gas';
  }

  const oneOfAmountsIsEmpty = !firstAmount || !secondAmount;

  const buttonDisabled = !isValidNetwork || insufficientBalance || oneOfAmountsIsEmpty;

  const { ratesData } = useUSDRate(firstCoin, secondCoin);
  const firstAssetRate = ratesData?.find((item) => item.asset === firstCoin)?.rate;
  const secondAssetRate = ratesData?.find((item) => item.asset === secondCoin)?.rate;

  return (
    <>
      <div className={styles.section}>
        <p>Selected pair</p>
        <div className={styles.sectionContent}>
          <div className={styles.coinPair}>
            <CoinPair firstCoin={firstCoin} secondCoin={secondCoin} />
            {!newPool && (
              <div className={styles.APR}>
                Estimated APR
                <Info tooltipText={APRTooltip} />
                <span className={clsx(styles.highlight, !aprValue && 'blurredText')}>+{aprValue ?? '1,23'}%</span>
              </div>
            )}
          </div>
          <div className={styles.poolStability}>
            <div className={clsx(styles.poolStabilityButton, !isStablePool && styles.poolStabilityButtonActive, !newPool && styles.poolStabilityButtonDisabled)}
                 onClick={() => handleStabilityChange(false)}
                 role="button"
            >
              <div className={styles.poolStabilityButtonTitle}>
                <p>Volatile pool</p>
                <Info tooltipText={VolatilePoolTooltip}/>
              </div>
              <p>0.30% fee tier</p>
            </div>
            <button className={clsx(styles.poolStabilityButton, isStablePool && styles.poolStabilityButtonActive, !newPool && styles.poolStabilityButtonDisabled)}
                    onClick={() => handleStabilityChange(true)}
                    role="button"
            >
              <div className={styles.poolStabilityButtonTitle}>
                <p>Stable pool</p>
                <Info tooltipText={StablePoolTooltip}/>
              </div>
              <p>0.05% fee tier</p>
            </button>
            {/*<button className={clsx(styles.poolStabilityButton, !isStablePool && styles.poolStabilityButtonActive, 'desktopOnly')}*/}
            {/*        onClick={() => setIsStablePool(false)}*/}
            {/*>*/}
            {/*  <p>0.30% fee tier (volatile pool)</p>*/}
            {/*  <Info tooltipText=""/>*/}
            {/*</button>*/}
            {/*<button className={clsx(styles.poolStabilityButton, isStablePool && styles.poolStabilityButtonActive, 'desktopOnly')}*/}
            {/*        onClick={() => setIsStablePool(true)}*/}
            {/*>*/}
            {/*  <p>0.05% fee tier (stable pool)</p>*/}
            {/*  <Info tooltipText=""/>*/}
            {/*</button>*/}
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <p>Deposit amount</p>
        <div className={styles.sectionContent}>
          <CoinInput
            coin={firstCoin}
            value={firstAmountInput}
            loading={!isFirstToken && isFetching}
            setAmount={setAmount(firstCoin)}
            balance={firstAssetBalanceValue}
            key={firstCoin}
            usdRate={firstAssetRate}
          />
          <CoinInput
            coin={secondCoin}
            value={secondAmountInput}
            loading={isFirstToken && isFetching}
            setAmount={setAmount(secondCoin)}
            balance={secondAssetBalanceValue}
            key={secondCoin}
            usdRate={secondAssetRate}
          />
        </div>
      </div>
      {/* <div className={clsx(styles.section, styles.prices)}>
        <p>Selected Price</p>
        <div className={clsx(styles.sectionContent, styles.priceBlocks)}>
          <div className={styles.priceBlock}>
            <p>Low price</p>
            <p>0</p>
          </div>
          <div className={styles.priceBlock}>
            <p>High price</p>
            <p>∞</p>
          </div>
        </div>
      </div> */}
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
    </>
  );
};

export default AddLiquidityDialog;
