import styles from "./index.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import WarningIcon from "@/src/components/icons/Warning/WarningIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {
  ChangeEvent,
  memo,
  MouseEvent,
  TouchEvent,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {useDebounceCallback} from "usehooks-ts";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {bn, formatUnits, FuelError} from "fuels";
import {PoolId} from "mira-dex-ts";
import usePositionData from "@/src/hooks/usePositionData";
import usePoolAPR from "@/src/hooks/usePoolAPR";
import {createPoolKey} from "@/src/utils/common";
import useRemoveLiquidity from "@/src/hooks/useRemoveLiquidity";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import useModal from "@/src/hooks/useModal/useModal";
import StatusModal, {ModalType} from "@/src/components/common/StatusModal";

type Props = {
  pool: PoolId;
};

const RemoveLiquidityModalContent = ({pool}: Props) => {
  useEffect(() => {
    if (sliderRef.current) {
      document.documentElement.style.setProperty(
        "--value",
        `${sliderRef.current.value}%`,
      );
    }
  }, []);

  const [SuccessModal, openSuccessModal] = useModal();
  const [FailureModal, openFailureModal] = useModal();

  const coinAMetadata = useAssetMetadata(pool[0].bits);
  const coinBMetadata = useAssetMetadata(pool[1].bits);
  const {assets, lpTokenBalance} = usePositionData({pool});
  const {apr} = usePoolAPR(pool);
  const isValidNetwork = useCheckActiveNetwork();

  const [removeLiquidityPercentage, setRemoveLiquidityPercentage] =
    useState(50);
  const [displayValue, setDisplayValue] = useState(removeLiquidityPercentage);

  const tvlValue = apr?.tvlUSD;
  const coinReserveA = apr?.reserve0;
  const coinReserveB = apr?.reserve1;

  const poolKey = createPoolKey(pool);
  const isStablePool = pool[2];

  const [assetA, assetB] = assets || [
    [pool[0], bn(0)],
    [pool[1], bn(0)],
  ];

  const coinAAmount = formatUnits(assetA[1], coinAMetadata.decimals);
  const coinAAmountToWithdraw = assetA[1]
    .mul(bn(removeLiquidityPercentage))
    .div(bn(100));
  const coinAAmountToWithdrawStr = formatUnits(
    coinAAmountToWithdraw,
    coinAMetadata.decimals,
  );

  const coinBAmount = formatUnits(assetB[1], coinBMetadata.decimals);
  const coinBAmountToWithdraw = assetB[1]
    .mul(bn(removeLiquidityPercentage))
    .div(bn(100));
  const coinBAmountToWithdrawStr = formatUnits(
    coinBAmountToWithdraw,
    coinBMetadata.decimals,
  );

  const {
    data,
    removeLiquidity,
    error: removeLiquidityError,
    isPending,
  } = useRemoveLiquidity({
    pool,
    liquidityPercentage: removeLiquidityPercentage,
    lpTokenBalance,
    coinAAmountToWithdraw,
    coinBAmountToWithdraw,
  });

  const confirmationModalAssetsAmounts = useRef({
    firstAsset: coinAAmountToWithdrawStr,
    secondAsset: coinBAmountToWithdrawStr,
  });

  const handleRemoveLiquidity = useCallback(async () => {
    try {
      const result = await removeLiquidity();
      if (result) {
        confirmationModalAssetsAmounts.current = {
          firstAsset: coinAAmountToWithdrawStr,
          secondAsset: coinBAmountToWithdrawStr,
        };
        openSuccessModal();
      }
    } catch (e) {
      openFailureModal();
    }
  }, [
    coinAAmountToWithdrawStr,
    coinBAmountToWithdrawStr,
    openFailureModal,
    openSuccessModal,
    removeLiquidity,
  ]);

  const sliderRef = useRef<HTMLInputElement>(null);

  const debouncedSetValue = useDebounceCallback(
    setRemoveLiquidityPercentage,
    500,
  );

  const handleMouseUp = (
    e: MouseEvent<HTMLInputElement> | TouchEvent<HTMLInputElement>,
  ) => {
    // @ts-expect-error add correct event type
    debouncedSetValue(Number(e.target.value));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(Number(e.target.value));
    document.documentElement.style.setProperty("--value", `${e.target.value}%`);
  };

  const handleMax = () => {
    debouncedSetValue(100);
    document.documentElement.style.setProperty("--value", "100%");
  };

  const getModalMessage = () => {
    const successMessage = `Removed ${confirmationModalAssetsAmounts.current.firstAsset} ${coinAMetadata.symbol} and ${confirmationModalAssetsAmounts.current.secondAsset} ${coinBMetadata.symbol} from your position`;

    let errorMessage: string;
    if (removeLiquidityError instanceof FuelError) {
      errorMessage = removeLiquidityError.message;
    } else {
      errorMessage =
        "An error occurred while processing your request. Please try again or contact support if the issue persists.";
    }

    return [successMessage, errorMessage];
  };

  const [successModalSubtitle, errorModalSubtitle] = getModalMessage();

  const withdrawalDisabled = !isValidNetwork;
  let buttonTitle = "Confirm";
  if (withdrawalDisabled) {
    buttonTitle = "Incorrect network";
  }

  return (
    <div className={styles.removeLiquidityContent}>
      <CoinPair
        firstCoin={pool[0].bits}
        secondCoin={pool[1].bits}
        isStablePool={isStablePool}
      />
      <div className={styles.valueAndMax}>
        <p className={styles.value}>{displayValue}%</p>
        <button className={styles.maxButton} onClick={handleMax}>
          Max
        </button>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={0}
        max={100}
        defaultValue={removeLiquidityPercentage}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        onChange={handleChange}
        ref={sliderRef}
      />
      <div className={styles.tableWrapper}>
        <table className={styles.liquidityTable}>
          <thead>
            <tr>
              <th />
              <th>{coinAMetadata.symbol}</th>
              <th>{coinBMetadata.symbol}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Current position</td>
              <td>{coinAAmount}</td>
              <td>{coinBAmount}</td>
            </tr>
            <tr className={styles.lastRow}>
              <td>Remove</td>
              <td>{coinAAmountToWithdrawStr}</td>
              <td>{coinBAmountToWithdrawStr}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className={styles.textBlock}>
        <p className={styles.infoBlockTitle}>
          <WarningIcon />
          Pay attention
        </p>
        <p className={styles.infoBlockText}>
          This based on the current price of the pool. Your fees earned will
          always increase, but the principal amount may change with the price of
          the pool
        </p>
      </div>
      <div className={styles.buttons}>
        <ActionButton
          onClick={handleRemoveLiquidity}
          disabled={withdrawalDisabled}
          loading={isPending}
        >
          {buttonTitle}
        </ActionButton>
      </div>
      <SuccessModal title={<></>}>
        <StatusModal
          type={ModalType.SUCCESS}
          transactionHash={data?.id}
          subTitle={successModalSubtitle}
          title="Removed liquidity successfully"
        />
      </SuccessModal>
      <FailureModal title={<></>}>
        <StatusModal
          type={ModalType.ERROR}
          subTitle={errorModalSubtitle}
          title="Failed to remove liquidity"
        />
      </FailureModal>
    </div>
  );
};

export default memo(RemoveLiquidityModalContent);
