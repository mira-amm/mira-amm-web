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
import useModal from "@/src/hooks/useModal/useModal";
import TransactionFailureModal from "@/src/components/common/TransactionFailureModal/TransactionFailureModal";
import {BN, bn} from "fuels";
import usePoolsMetadata from "@/src/hooks/usePoolsMetadata";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import { useAssetPrice } from "@/src/hooks/useAssetPrice";

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

  const [firstAmount, setFirstAmount] = useState(new BN(0));
  const [firstAmountInput, setFirstAmountInput] = useState('');
  const [secondAmount, setSecondAmount] = useState(new BN(0));
  const [secondAmountInput, setSecondAmountInput] = useState('');
  const [activeAsset, setActiveAsset] = useState<string | null>(null);
  const [isStablePool, setIsStablePool] = useState(poolId[2]);

  const asset0Metadata = useAssetMetadata(poolId[0].bits);
  const asset1Metadata = useAssetMetadata(poolId[1].bits);

  const isFirstToken = activeAsset === poolId[0].bits;

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
  const aprValue = apr !== undefined
    ? apr.toLocaleString(DefaultLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  const debouncedSetFirstAmount = useDebounceCallback(setFirstAmount, 500);
  const debouncedSetSecondAmount = useDebounceCallback(setSecondAmount, 500);

  useEffect(() => {
    if (data) {
      const anotherTokenDecimals = isFirstToken ? asset1Metadata.decimals : asset0Metadata.decimals;
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

  const setAmount = useCallback((coin: string) => {
    return (value: string) => {
      if (value === '') {
        debouncedSetFirstAmount(new BN(0));
        debouncedSetSecondAmount(new BN(0));
        setFirstAmountInput('');
        setSecondAmountInput('');
        setActiveAsset(coin);
        return;
      }

      if (coin === poolId[0].bits) {
        debouncedSetFirstAmount(bn.parseUnits(value, asset0Metadata.decimals));
        setFirstAmountInput(value);
      } else {
        debouncedSetSecondAmount(bn.parseUnits(value, asset1Metadata.decimals));
        setSecondAmountInput(value);
      }
      setActiveAsset(coin);
    };
  }, [
    debouncedSetFirstAmount,
    debouncedSetSecondAmount,
    poolId,
    asset0Metadata,
    asset1Metadata
  ]);

  const sufficientEthBalanceForFirstCoin = useCheckEthBalance({
    assetId: poolId[0].bits,
    amount: firstAmount.formatUnits(asset0Metadata.decimals),
  });
  const sufficientEthBalanceForSecondCoin = useCheckEthBalance({
    assetId: poolId[1].bits,
    amount: secondAmount.formatUnits(asset1Metadata.decimals),
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
          amount: firstAmount,
          assetId: poolId[0].bits,
        },
        {
          amount: secondAmount,
          assetId: poolId[1].bits,
        }
      ],
      isStablePool,
    });
  }, [
    sufficientEthBalance,
    setPreviewData,
    firstAmount,
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

  const { price: asset0Price } = useAssetPrice(poolId[0].bits);
  const { price: asset1Price } = useAssetPrice(poolId[1].bits);

  return (
    <>
      <div className={styles.section}>
        <p>Selected pair</p>
        <div className={styles.sectionContent}>
          <div className={styles.coinPair}>
            <CoinPair firstCoin={poolId[0].bits} secondCoin={poolId[1].bits} isStablePool={isStablePool}/>
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
            assetId={poolId[0].bits}
            value={firstAmountInput}
            loading={!isFirstToken && isFetching}
            setAmount={setAmount(poolId[0].bits)}
            balance={firstAssetBalance}
            key={poolId[0].bits}
            usdRate={asset0Price}
          />
          <CoinInput
            assetId={poolId[1].bits}
            value={secondAmountInput}
            loading={isFirstToken && isFetching}
            setAmount={setAmount(poolId[1].bits)}
            balance={secondAssetBalance}
            key={poolId[1].bits}
            usdRate={asset1Price}
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
