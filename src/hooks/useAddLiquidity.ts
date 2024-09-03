import {useMutation, useQuery} from "@tanstack/react-query";
import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {DefaultTxParams} from "@/src/utils/constants";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {createAssetIdInput} from "@/src/utils/common";
import {LiquidityParameters} from "mira-dex-ts";
import {useCallback} from "react";
import {BN} from "fuels";
import {useWallet} from "@fuels/react";

type Props = {
  firstCoin: CoinName;
  firstCoinAmount: string;
  secondCoin: CoinName;
  secondCoinAmount: string;
  liquidityAmount: BN | undefined;
};

const useAddLiquidity = ({ firstCoin, firstCoinAmount, secondCoin, secondCoinAmount, liquidityAmount }: Props) => {
  const mira = useMiraDex();
  const { wallet } = useWallet();

  const mutationFn = useCallback(async () => {
    if (!mira || !wallet || !liquidityAmount) {
      return;
    }

    const firstCoinAssetIdInput = createAssetIdInput(firstCoin);
    const secondCoinAssetIdInput = createAssetIdInput(secondCoin);

    const firstCoinAmountToUse = parseFloat(firstCoinAmount) * 10 ** coinsConfig.get(firstCoin)?.decimals!;
    const secondCoinAmountToUse = parseFloat(secondCoinAmount) * 10 ** coinsConfig.get(secondCoin)?.decimals!;

    const liquidityParams: LiquidityParameters = {
      deposits: {
        a: {
          id: firstCoinAssetIdInput,
          amount: firstCoinAmountToUse,
        },
        b: {
          id: secondCoinAssetIdInput,
          amount: secondCoinAmountToUse,
        }
      },
      liquidity: liquidityAmount,
      deadline: 10_000_000,
    };

    const tx = await mira.addLiquidity([firstCoinAssetIdInput, secondCoinAssetIdInput], liquidityParams, DefaultTxParams);
    return await wallet.sendTransaction(tx);
  }, [mira, wallet, firstCoin, secondCoin, firstCoinAmount, secondCoinAmount, liquidityAmount]);

  const { data, mutateAsync, isPending  } = useMutation({
    mutationFn,
  });

  return { data, mutateAsync, isPending };
};

export default useAddLiquidity;
