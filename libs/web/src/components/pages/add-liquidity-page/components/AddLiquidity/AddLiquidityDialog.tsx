import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import {Button} from "@/meshwave-ui/Button";
import {BN, bn} from "fuels";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {PoolId} from "mira-dex-ts";
import {useDebounceCallback} from "usehooks-ts";
import {clsx} from "clsx";

import CoinInput from "@/src/components/pages/add-liquidity-page/components/CoinInput/CoinInput";
import {openNewTab} from "@/src/utils/common";
import {Info, TransactionFailureModal} from "@/src/components/common";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {AprBadge} from "@/src/components/common/AprBadge/AprBadge";
import {usePoolNameAndMatch} from "@/src/hooks/usePoolNameAndMatch";

import {
  usePreviewAddLiquidity,
  useAssetBalance,
  usePoolAPR,
  usePoolsMetadata,
  useFaucetLink,
  useAssetMetadata,
  useAssetPrice,
  useModal,
  useCheckEthBalance,
  useCheckActiveNetwork,
  useBalances,
} from "@/src/hooks";
import {DefaultLocale, FuelAppUrl} from "@/src/utils/constants";
import {AddLiquidityPreviewData} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/PreviewAddLiquidityDialog";

import {
  APRTooltip,
  StablePoolTooltip,
  VolatilePoolTooltip,
} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/addLiquidityTooltips";
import {cn} from "@/src/utils/cn";

const AddLiquidityDialog = ({
  poolId,
  setPreviewData,
  poolKey,
}: {
  poolId: PoolId;
  setPreviewData: Dispatch<SetStateAction<AddLiquidityPreviewData | null>>;
  poolKey: string;
}) => {
  const [FailureModal, openFailureModal, closeFailureModal] = useModal();

  const {isConnected, isPending: isConnecting} = useIsConnected();
  const {connect} = useConnectUI();
  const {balances} = useBalances();

  const firstAssetId = poolId[0].bits;
  const secondAssetId = poolId[1].bits;

  const firstAssetBalance = useAssetBalance(balances, firstAssetId);
  const secondAssetBalance = useAssetBalance(balances, secondAssetId);

  const [firstAmount, setFirstAmount] = useState(new BN(0));
  const [firstAmountInput, setFirstAmountInput] = useState("");
  const [secondAmount, setSecondAmount] = useState(new BN(0));
  const [secondAmountInput, setSecondAmountInput] = useState("");
  const [activeAsset, setActiveAsset] = useState<string | null>(null);
  const [isStablePool, setIsStablePool] = useState(poolId[2]);

  const asset0Metadata = useAssetMetadata(poolId[0].bits);
  const asset1Metadata = useAssetMetadata(poolId[1].bits);

  const isFirstToken = activeAsset === poolId[0].bits;

  const {poolsMetadata} = usePoolsMetadata([poolId]);
  const emptyPool = Boolean(
    poolsMetadata?.[0]?.reserve0.eq(0) && poolsMetadata?.[0].reserve1.eq(0)
  );

  //Checks if the pool with rewards matches the current pool
  const {isMatching} = usePoolNameAndMatch(poolKey);

  const {
    data,
    isFetching,
    error: previewError,
  } = usePreviewAddLiquidity({
    firstAssetId,
    secondAssetId,
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

  const {apr} = usePoolAPR(poolId);

  const aprValue =
    apr !== undefined
      ? apr.apr.toLocaleString(DefaultLocale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  const tvlValue = apr?.tvlUSD;

  const debouncedSetFirstAmount = useDebounceCallback(setFirstAmount, 500);
  const debouncedSetSecondAmount = useDebounceCallback(setSecondAmount, 500);

  useEffect(() => {
    if (data) {
      const anotherTokenDecimals = isFirstToken
        ? asset1Metadata.decimals
        : asset0Metadata.decimals;
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

  const sufficientEthBalanceForFirstCoin = useCheckEthBalance({
    assetId: poolId[0].bits,
    amount: firstAmount.formatUnits(asset0Metadata.decimals),
  });
  const sufficientEthBalanceForSecondCoin = useCheckEthBalance({
    assetId: poolId[1].bits,
    amount: secondAmount.formatUnits(asset1Metadata.decimals),
  });
  const sufficientEthBalance =
    sufficientEthBalanceForFirstCoin && sufficientEthBalanceForSecondCoin;

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
        },
      ],
      isStablePool,
    });
  }, [
    sufficientEthBalance,
    setPreviewData,
    firstAmount,
    secondAmount,
    isStablePool,
    faucetLink,
  ]);

  const isValidNetwork = useCheckActiveNetwork();

  const insufficientFirstBalance = firstAmount.gt(firstAssetBalance);
  const insufficientSecondBalance = secondAmount.gt(secondAssetBalance);
  const insufficientBalance =
    insufficientFirstBalance || insufficientSecondBalance;

  let buttonTitle = "Preview";
  if (!isValidNetwork) {
    buttonTitle = "Incorrect network";
  } else if (!sufficientEthBalance) {
    buttonTitle = "Bridge more ETH to pay for gas";
  } else if (insufficientBalance) {
    buttonTitle = "Insufficient balance";
  }

  const oneOfAmountsIsEmpty = firstAmount.eq(0) || secondAmount.eq(0);

  const buttonDisabled =
    !isValidNetwork || insufficientBalance || oneOfAmountsIsEmpty;

  const {price: asset0Price} = useAssetPrice(poolId[0].bits);
  const {price: asset1Price} = useAssetPrice(poolId[1].bits);

  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="text-base text-[var(--content-primary)]">Selected pair</p>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
            <CoinPair
              firstCoin={firstAssetId}
              secondCoin={secondAssetId}
              isStablePool={isStablePool}
            />
            <div className="flex flex-col items-end gap-1 pb-1 text-[12px] leading-[14px] lg:flex-row">
              <div className="flex items-center gap-1">
                <p className="text-sm">Estimated APR</p>
                <Info tooltipText={APRTooltip} tooltipKey="apr" />
              </div>
              {isMatching ? (
                <div>
                  <AprBadge
                    aprValue={
                      aprValue === "NaN"
                        ? "n/a"
                        : aprValue
                          ? `${aprValue}%`
                          : "pending"
                    }
                    small
                    leftAlignValue="-200px"
                    poolKey={poolKey}
                    tvlValue={tvlValue}
                  />
                </div>
              ) : (
                <span
                  className={clsx(
                    aprValue && "text-content-positive pb-[2px]",
                    !aprValue && "text-content-dimmed-dark"
                  )}
                >
                  {aprValue ? `${aprValue}%` : "Awaiting data"}
                </span>
              )}
            </div>
          </div>
          <div className="flex w-full gap-2">
            <div
              role="button"
              className={cn(
                "flex w-full flex-col items-start gap-[10px] rounded-md bg-background-secondary dark:bg-background-secondary p-[10px_12px] text-content-dimmed-light cursor-not-allowed",
                !isStablePool &&
                  "border dark:border-accent-primary dark:text-content-primary bg-background-primary text-white"
              )}
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

            <div
              role="button"
              className={cn(
                "flex w-full flex-col items-start gap-[10px] rounded-md bg-background-secondary dark:bg-background-secondary p-[10px_12px] text-content-dimmed-light cursor-not-allowed",
                isStablePool &&
                  "border dark:border-accent-primary dark:text-content-primary bg-background-primary text-white"
              )}
            >
              <div className="flex w-full">
                <p className="flex-1 text-left">Stable pool</p>
                <Info tooltipText={StablePoolTooltip} tooltipKey="stablePool" />
              </div>
              <p>0.05% fee tier</p>
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
            loading={!isFirstToken && isFetching}
            setAmount={setAmount(poolId[0].bits)}
            balance={firstAssetBalance}
            usdRate={asset0Price || undefined}
          />
          <CoinInput
            assetId={secondAssetId}
            value={secondAmountInput}
            loading={isFirstToken && isFetching}
            setAmount={setAmount(poolId[1].bits)}
            balance={secondAssetBalance}
            usdRate={asset1Price || undefined}
          />
        </div>
      </div>
      {!isConnected ? (
        <Button
          onClick={connect}
          loading={isConnecting}
          variant="secondary"
          size="lg"
        >
          Connect Wallet
        </Button>
      ) : (
        <Button disabled={buttonDisabled} onClick={handleButtonClick} size="lg">
          {buttonTitle}
        </Button>
      )}
      <FailureModal title={<></>}>
        <TransactionFailureModal
          error={previewError}
          closeModal={closeFailureModal}
        />
      </FailureModal>
    </>
  );
};

export default AddLiquidityDialog;
