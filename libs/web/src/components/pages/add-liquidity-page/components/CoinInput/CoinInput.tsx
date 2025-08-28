import {Coin} from "@/src/components/common";
import {ChangeEvent, memo, useCallback} from "react";
import {TextButton} from "@/src/components/common";
import {MinEthValueBN} from "@/src/utils/constants";
import {BN} from "fuels";
import {useAssetMetadata} from "@/src/hooks";
import fiatValueFormatter from "@/src/utils/abbreviateNumber";

const CoinInput = ({
  assetId,
  value,
  loading,
  setAmount,
  balance,
  usdRate,
  onAssetClick,
}: {
  assetId: string | null;
  value: string;
  loading: boolean;
  setAmount: (amount: string) => void;
  balance: BN;
  usdRate: number | undefined;
  onAssetClick?: VoidFunction;
}) => {
  const metadata = useAssetMetadata(assetId);
  const balanceValue = balance.formatUnits(metadata.decimals || 0);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(",", ".");
    const re = new RegExp(`^[0-9]*[.]?[0-9]{0,${metadata.decimals || 0}}$`);
    if (re.test(inputValue)) {
      setAmount(inputValue);
    }
  };

  const handleMaxClick = useCallback(() => {
    let amountStringToSet;
    if (metadata.symbol === "ETH") {
      const amountWithoutGasFee = balance.sub(MinEthValueBN);
      amountStringToSet = amountWithoutGasFee.gt(0)
        ? amountWithoutGasFee.formatUnits(metadata.decimals || 0)
        : balanceValue;
    } else {
      amountStringToSet = balanceValue;
    }
    setAmount(amountStringToSet);
  }, [metadata, balance, setAmount]);

  const numericValue = parseFloat(value);
  const usdValue =
    !isNaN(numericValue) && Boolean(usdRate)
      ? fiatValueFormatter(numericValue * usdRate!)
      : null;

  return (
    <div className="min-h-[65px] flex items-center gap-1 p-3 rounded-lg bg-background-secondary">
      <div className="flex flex-col gap-1 items-start flex-1">
        <input
          type="text"
          inputMode="decimal"
          pattern="^[0-9]*[.,]?[0-9]*$"
          placeholder="0"
          minLength={1}
          value={value}
          disabled={loading}
          onChange={handleChange}
          className="w-full  text-content-primary text-sm leading-4 bg-transparent border-none disabled:text-content-dimmed-dark lg:text-base lg:leading-[19px] font-alt"
        />
        {usdValue !== null && (
          <p className="min-h-[16px] text-xs leading-4 text-content-tertiary lg:min-h-[18px] lg:text-sm lg:leading-[18px]">
            {usdValue}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1 items-end [&_svg]:w-4 [&_svg]:h-4 [&_img]:w-4 [&_img]:h-4">
        <Coin
          assetId={assetId}
          className="text-sm leading-4 lg:text-base lg:leading-[19px]"
          onClick={onAssetClick}
        />
        {balance.gt(0) && (
          <span className="text-xs leading-4 text-content-tertiary lg:text-sm lg:leading-[18px]">
            Balance: {balanceValue}&nbsp;
            <TextButton onClick={handleMaxClick}>Max</TextButton>
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(CoinInput);
