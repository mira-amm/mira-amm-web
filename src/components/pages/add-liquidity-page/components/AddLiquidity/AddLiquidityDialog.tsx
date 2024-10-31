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
  getAssetDecimalsByAssetId,
  getAssetNamesFromPoolId,
  openNewTab
} from "@/src/utils/common";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import usePoolAPR from "@/src/hooks/usePoolAPR";
import {DefaultLocale, FuelAppUrl} from "@/src/utils/constants";
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
import useModal from "@/src/hooks/useModal/useModal";
import TransactionFailureModal from "@/src/components/common/TransactionFailureModal/TransactionFailureModal";
import {BN, bn} from "fuels";
import usePoolsMetadata from "@/src/hooks/usePoolsMetadata";

type Props = {
  poolId: PoolId;
  setPreviewData: Dispatch<SetStateAction<AddLiquidityPreviewData | null>>;
  newPool?: boolean;
}

const AddLiquidityDialog = ({ poolId, setPreviewData, newPool }: Props) => {
  const [FailureModal, openFailureModal, closeFailureModal] = useModal();

  const { isConnected, isPending: isConnecting } = useIsConnected();
  const { connect } = useConnectUI();
  const { balances } = useBalances();

  const firstAssetBalance = useAssetBalance(balances, poolId[0].bits);
  const secondAssetBalance = useAssetBalance(balances, poolId[1].bits);

  const firstAssetDecimals = getAssetDecimalsByAssetId(poolId[0].bits);
  const secondAssetDecimals = getAssetDecimalsByAssetId(poolId[1].bits);

  const [firstAmount, setFirstAmount] = useState(new BN(0));
  const [firstAmountInput, setFirstAmountInput] = useState('');
  const [secondAmount, setSecondAmount] = useState(new BN(0));
  const [secondAmountInput, setSecondAmountInput] = useState('');
  const [activeAssetName, setActiveAssetName] = useState<CoinName | null>(null);
  const [isStablePool, setIsStablePool] = useState(poolId[2]);

  // TODO: Change logic to work with asset ids only
  const { firstAssetName: firstCoin, secondAssetName: secondCoin } = getAssetNamesFromPoolId(poolId);
  const isFirstToken = activeAssetName === firstCoin;

  const { poolsMetadata } = usePoolsMetadata([poolId]);
  const emptyPool = Boolean(poolsMetadata?.[0]?.reserve0.eq(0) && poolsMetadata?.[0].reserve1.eq(0));

  const { data, isFetching, error: previewError } = usePreviewAddLiquidity({
    firstCoin: poolId[0].bits,
    secondCoin: poolId[1].bits,
    amount: isFirstToken ? firstAmount : secondAmount,
    isFirstToken,
    isStablePool,
    fetchCondition: !emptyPool,
  });

  useEffect(() => {
    if (previewError) {
      openFailureModal();
    }
  }, [previewError]);

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
      const anotherTokenValue = data[1];
      const anotherTokenValueString = data[1].formatUnits(anotherTokenDecimals);

      if (isFirstToken) {
        setSecondAmount(anotherTokenValue);
        setSecondAmountInput(anotherTokenValueString);
      } else {
        setFirstAmount(anotherTokenValue);
        setFirstAmountInput(anotherTokenValueString);
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
        debouncedSetFirstAmount(new BN(0));
        debouncedSetSecondAmount(new BN(0));
        setFirstAmountInput('');
        setSecondAmountInput('');
        setActiveAssetName(coin);
        return;
      }

      if (coin === firstCoin) {
        debouncedSetFirstAmount(bn.parseUnits(value, firstAssetDecimals));
        setFirstAmountInput(value);
      } else {
        debouncedSetSecondAmount(bn.parseUnits(value, secondAssetDecimals));
        setSecondAmountInput(value);
      }
      setActiveAssetName(coin);
    };
  }, [
    debouncedSetFirstAmount,
    debouncedSetSecondAmount,
    firstCoin,
    firstAssetDecimals,
    secondAssetDecimals
  ]);

  const sufficientEthBalanceForFirstCoin = useCheckEthBalance({
    coin: firstCoin,
    amount: firstAmount.formatUnits(firstAssetDecimals),
  });
  const sufficientEthBalanceForSecondCoin = useCheckEthBalance({
    coin: secondCoin,
    amount: secondAmount.formatUnits(secondAssetDecimals),
  });
  const sufficientEthBalance = sufficientEthBalanceForFirstCoin && sufficientEthBalanceForSecondCoin;

  const faucetLink = useFaucetLink();
  const handleButtonClick = useCallback(() => {
    if (!sufficientEthBalance) {
      openNewTab(`${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true&=true`);
      return;
    }

    setPreviewData({
      assets: [
        {
          coin: firstCoin,
          amount: firstAmount,
          assetId: poolId[0].bits,
        },
        {
          coin: secondCoin,
          amount: secondAmount,
          assetId: poolId[1].bits,
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

  const insufficientFirstBalance = firstAmount.gt(firstAssetBalance);
  const insufficientSecondBalance = secondAmount.gt(secondAssetBalance);
  const insufficientBalance = insufficientFirstBalance || insufficientSecondBalance;

  let buttonTitle = 'Preview';
  if (!isValidNetwork) {
    buttonTitle = 'Incorrect network';
  } else if (!sufficientEthBalance) {
    buttonTitle = 'Bridge more ETH to pay for gas';
  } else if (insufficientBalance) {
    buttonTitle = 'Insufficient balance';
  }

  const oneOfAmountsIsEmpty = firstAmount.eq(0) || secondAmount.eq(0);

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
            <CoinPair firstCoin={firstCoin} secondCoin={secondCoin} isStablePool={isStablePool}/>
            {!newPool && (
              <div className={styles.APR}>
                Estimated APR
                <Info tooltipText={APRTooltip} tooltipKey="apr"/>
                <span className={clsx(aprValue && styles.highlight, !aprValue && styles.pending)}>
                  {aprValue ? `${aprValue}%` : 'Awaiting data'}
                </span>
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
                <Info tooltipText={VolatilePoolTooltip} tooltipKey="volatilePool"/>
              </div>
              <p>0.30% fee tier</p>
            </div>

            <div className={clsx(styles.poolStabilityButton, isStablePool && styles.poolStabilityButtonActive, !newPool && styles.poolStabilityButtonDisabled)}
                    onClick={() => handleStabilityChange(true)}
                    role="button"
            >
              <div className={styles.poolStabilityButtonTitle}>
                <p>Stable pool</p>
                <Info tooltipText={StablePoolTooltip} tooltipKey="stablePool"/>
              </div>
              <p>0.05% fee tier</p>
            </div>
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
            balance={firstAssetBalance}
            key={firstCoin}
            usdRate={firstAssetRate}
          />
          <CoinInput
            coin={secondCoin}
            value={secondAmountInput}
            loading={isFirstToken && isFetching}
            setAmount={setAmount(secondCoin)}
            balance={secondAssetBalance}
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
      <FailureModal title={<></>}>
        <TransactionFailureModal error={previewError} closeModal={closeFailureModal} />
      </FailureModal>
    </>
  );
};

export default AddLiquidityDialog;
