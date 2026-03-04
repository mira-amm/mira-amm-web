import {BN} from "fuels";
import {useCheckActiveNetwork, useCheckEthBalance} from "@/src/hooks";

type UseLiquidityValidationProps = {
  firstAmount: BN;
  secondAmount: BN;
  firstAssetBalance: BN;
  secondAssetBalance: BN;
  firstAssetId: string;
  secondAssetId: string;
  asset0Decimals: number;
  asset1Decimals: number;
};

export const useLiquidityValidation = ({
  firstAmount,
  secondAmount,
  firstAssetBalance,
  secondAssetBalance,
  firstAssetId,
  secondAssetId,
  asset0Decimals,
  asset1Decimals,
}: UseLiquidityValidationProps) => {
  const isValidNetwork = useCheckActiveNetwork();

  const sufficientEthBalanceForFirstCoin = useCheckEthBalance({
    assetId: firstAssetId,
    amount: firstAmount.formatUnits(asset0Decimals),
  });

  const sufficientEthBalanceForSecondCoin = useCheckEthBalance({
    assetId: secondAssetId,
    amount: secondAmount.formatUnits(asset1Decimals),
  });

  const sufficientEthBalance =
    sufficientEthBalanceForFirstCoin && sufficientEthBalanceForSecondCoin;

  const insufficientFirstBalance = firstAmount.gt(firstAssetBalance);
  const insufficientSecondBalance = secondAmount.gt(secondAssetBalance);
  const insufficientBalance =
    insufficientFirstBalance || insufficientSecondBalance;

  const oneOfAmountsIsEmpty = firstAmount.eq(0) || secondAmount.eq(0);

  const buttonDisabled =
    !isValidNetwork || insufficientBalance || oneOfAmountsIsEmpty;

  let buttonTitle = "Preview";
  if (!isValidNetwork) {
    buttonTitle = "Incorrect network";
  } else if (!sufficientEthBalance) {
    buttonTitle = "Bridge more ETH to pay for gas";
  } else if (insufficientBalance) {
    buttonTitle = "Insufficient balance";
  }

  return {
    isValidNetwork,
    sufficientEthBalance,
    insufficientBalance,
    insufficientFirstBalance,
    insufficientSecondBalance,
    oneOfAmountsIsEmpty,
    buttonDisabled,
    buttonTitle,
  };
};
