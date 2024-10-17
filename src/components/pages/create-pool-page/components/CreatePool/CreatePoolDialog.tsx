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
import {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import {useDebounceCallback} from "usehooks-ts";
import useCheckEthBalance from "@/src/hooks/useCheckEthBalance/useCheckEthBalance";
import useFaucetLink from "@/src/hooks/useFaucetLink";
import {getAssetDecimalsByAssetId, getAssetNameByAssetId, openNewTab} from "@/src/utils/common";
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

type Props = {
  setPreviewData: Dispatch<SetStateAction<CreatePoolPreviewData | null>>;
  newPool?: boolean;
}

const CreatePoolDialog = ({ setPreviewData, newPool }: Props) => {
  const [AssetsListModal, openAssetsListModal, closeAssetsListModal] = useModal();

  const { isConnected, isPending: isConnecting } = useIsConnected();
  const { connect } = useConnectUI();
  const { balances } = useBalances();

  const [firstAssetId, setFirstAssetId] = useState<string>(coinsConfig.get('ETH')?.assetId!);
  const [secondAssetId, setSecondAssetId] = useState<string>(coinsConfig.get('USDT')?.assetId!);

  const firstAssetBalanceValue = useAssetBalance(balances, firstAssetId);
  const secondAssetBalanceValue = useAssetBalance(balances, secondAssetId);
  const firstAssetDecimals = getAssetDecimalsByAssetId(firstAssetId);
  const secondAssetDecimals = getAssetDecimalsByAssetId(secondAssetId);

  const [firstAmount, setFirstAmount] = useState('');
  const [firstAmountInput, setFirstAmountInput] = useState('');
  const [secondAmount, setSecondAmount] = useState('');
  const [secondAmountInput, setSecondAmountInput] = useState('');
  const [activeAssetName, setActiveAssetName] = useState<CoinName | null>(null);
  const [isStablePool, setIsStablePool] = useState(false);

  const activeAssetForAssetSelector = useRef<string | null>(null);

  // TODO: Change logic to work with asset ids only
  const firstCoin = getAssetNameByAssetId(firstAssetId);
  const secondCoin = getAssetNameByAssetId(secondAssetId);
  const isFirstToken = activeAssetName === firstCoin;

  const poolId = buildPoolId(firstAssetId, secondAssetId, isStablePool);
  const { poolsMetadata } = usePoolsMetadata([poolId]);
  const poolExists = Boolean(poolsMetadata) && Boolean(poolsMetadata?.[0]);

  const { data, isFetching } = usePreviewAddLiquidity({
    firstCoin,
    secondCoin,
    amountString: isFirstToken ? firstAmount : secondAmount,
    isFirstToken,
    isStablePool,
    fetchCondition: poolExists,
  });

  // const { apr } = usePoolAPR(poolId);
  // const aprValue = apr
  //   ? parseFloat(apr).toLocaleString(DefaultLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  //   : null;

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
      isNewPool: !poolExists,
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

  const handleAssetClick = useCallback((assetId: string) => {
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

  return (
    <>
      <div className={styles.section}>
        <p>Selected pair</p>
        <div className={styles.sectionContent}>
          <div className={styles.coinPair}>
            <CoinPair firstCoin={firstCoin} secondCoin={secondCoin} isStablePool={isStablePool}/>
            {/*{!newPool && (*/}
            {/*  <div className={styles.APR}>*/}
            {/*    Estimated APR*/}
            {/*    <Info tooltipText={APRTooltip} />*/}
            {/*    <span className={clsx(styles.highlight, !aprValue && 'blurredText')}>+{aprValue ?? '1,23'}%</span>*/}
            {/*  </div>*/}
            {/*)}*/}
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
            <button className={clsx(styles.poolStabilityButton, isStablePool && styles.poolStabilityButtonActive, !newPool && styles.poolStabilityButtonDisabled)}
                    onClick={() => handleStabilityChange(true)}
                    role="button"
            >
              <div className={styles.poolStabilityButtonTitle}>
                <p>Stable pool</p>
                <Info tooltipText={StablePoolTooltip} tooltipKey="stablePool"/>
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
            newPool
            onAssetClick={handleAssetClick(firstAssetId)}
          />
          <CoinInput
            coin={secondCoin}
            value={secondAmountInput}
            loading={isFirstToken && isFetching}
            setAmount={setAmount(secondCoin)}
            balance={secondAssetBalanceValue}
            key={secondCoin}
            usdRate={secondAssetRate}
            newPool
            onAssetClick={handleAssetClick(secondAssetId)}
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
      <AssetsListModal title="Choose token">
        <CoinsListModal selectCoin={handleAssetSelection} balances={balances} />
      </AssetsListModal>
    </>
  );
};

export default CreatePoolDialog;
