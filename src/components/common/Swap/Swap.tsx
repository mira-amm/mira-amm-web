import { useMemo, useState } from "react";
import { useConnectUI, useIsConnected, useWallet } from "@fuels/react";
import MiraAmm from "sdk-ts";
import {
  AssetIdInput,
  AssetInput,
} from "sdk-ts/dist/typegen/amm-contract/AmmContractAbi";

import CurrencyBox from "@/src/components/common/Swap/components/CurrencyBox/CurrencyBox";
import SettingsIcon from "@/src/components/icons/Settings/SettingsIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import ConvertIcon from "@/src/components/icons/Convert/ConvertIcon";
import IconButton from "@/src/components/common/IconButton/IconButton";
import useModal from "@/src/hooks/useModal/useModal";
import InfoIcon from "@/src/components/icons/Info/InfoIcon";
import { coinsConfig } from "@/src/utils/coinsConfig";

import styles from "./Swap.module.css";
import { BN } from "fuels";

export type CurrencyBoxMode = "buy" | "sell";
// TODO: Store amount later + specify coins dict rather than string
type SwapState = Record<CurrencyBoxMode, string>;

const Swap = () => {
  const [Modal, openModal, closeModal] = useModal();
  const [coins, setCoins] = useState<SwapState>({
    sell: "",
    buy: "",
  });

  const { isConnected } = useIsConnected();
  const { connect, isConnecting } = useConnectUI();
  const { wallet } = useWallet();

  // TODO: Create hook to provide Mira instance
  const miraInstance = useMemo(() => {
    if (wallet && wallet.provider) {
      // @ts-ignore
      return new MiraAmm({
        wallet,
        provider: wallet?.provider,
        contractAddress:
          "0xb942cd8440a4fe2e2e7548cfcb1d1547881cfe02db66a463b19e1e46ae56f0ca",
      });
    }
  }, [wallet]);

  const selectCoin = (mode: "buy" | "sell") => {
    return (coin: string) => {
      if (
        (mode === "buy" && coins.sell === coin) ||
        (mode === "sell" && coins.buy === coin)
      ) {
        changeCoins();
      } else {
        setCoins({ ...coins, [mode]: coin });
      }
    };
  };

  const changeCoins = () => {
    setCoins({ sell: coins.buy, buy: coins.sell });
  };

  const handleSwap = async () => {
    const sellAssetId = coinsConfig.get(coins.sell)?.assetId!;
    const sellAssetIdInput: AssetIdInput = { bits: sellAssetId };
    const buyAssetId = coinsConfig.get(coins.buy)?.assetId!;
    const buyAssetIdInput: AssetIdInput = { bits: buyAssetId };
    const assetPair: [AssetIdInput, AssetIdInput] = [
      sellAssetIdInput,
      buyAssetIdInput,
    ];
    const assetSwapInput: AssetInput = { id: sellAssetIdInput, amount: 100 };
    if (miraInstance) {
      // Preview swap exact input
      // const result = await miraInstance.previewSwapExactInput(assetPair, assetSwapInput, { gasLimit: 100_000, maxFee: 100_000 });

      // Preview swap exact output
      // const result = await miraInstance.previewSwapExactOutput(assetPair, assetSwapInput, { gasLimit: 100_000, maxFee: 100_000 });

      // Balance
      // const result = await miraInstance.balance(assetPair, sellAssetIdInput, { gasLimit: 100_000, maxFee: 100_000 });

      // Preview add liquidity
      // const result = await miraInstance.previewAddLiquidity(assetPair, assetSwapInput, { gasLimit: 100_000, maxFee: 100_000 });

      const result = await miraInstance.swapExactInput( assetPair, assetSwapInput.amount,0,1000000000, { gasLimit: 1_000_000, maxFee: 1_000_000 });
      console.log(result);
      const res = await wallet?.sendTransaction(result); 
      console.log(res);
    }
  };

  return (
    <>
      <div className={styles.swapContainer}>
        <div className={styles.heading}>
          <p className={styles.title}>Swap</p>
          <IconButton onClick={openModal} className={styles.settingsButton}>
            <SettingsIcon />
          </IconButton>
        </div>
        <CurrencyBox
          mode="sell"
          selectedCoin={coins.sell}
          selectCoin={selectCoin("sell")}
        />
        <div className={styles.splitter}>
          <IconButton onClick={changeCoins} className={styles.convertButton}>
            <ConvertIcon />
          </IconButton>
        </div>
        <CurrencyBox
          mode="buy"
          selectedCoin={coins.buy}
          selectCoin={selectCoin("buy")}
        />
        {!isConnected && (
          <ActionButton
            variant="secondary"
            onClick={connect}
            loading={isConnecting}
          >
            Connect Wallet
          </ActionButton>
        )}
        {isConnected && (
          <ActionButton variant="primary" onClick={handleSwap}>
            Swap
          </ActionButton>
        )}
      </div>
      {/* TODO: Create modal content component */}
      <Modal title="Settings">
        <div className={styles.settingsContainer}>
          <div className={styles.settingsSection}>
            <p>Slippage Tolerance</p>
            <p className={styles.settingsText}>
              The amount the price can change unfavorably before the trade
              reverts
            </p>
          </div>
          <div className={styles.settingsSection}>
            <div className={styles.slippageButtons}>
              <button className={styles.slippageButton}>Auto</button>
              <button className={styles.slippageButton}>Custom</button>
            </div>
            <input type="text" className={styles.slippageInput} value="1%" />
          </div>
          <div className={styles.settingsSection}>
            <p className={styles.infoHeading}>
              <InfoIcon />
              Pay attention
            </p>
            <p className={styles.settingsText}>
              Customized price impact limit may lead to loss of funds. Use it at
              your own risk
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Swap;
