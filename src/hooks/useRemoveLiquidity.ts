import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {useMutation} from "@tanstack/react-query";
import {useCallback} from "react";
import {PoolId} from "mira-dex-ts";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {useWallet} from "@fuels/react";
import {BN} from "fuels";

type Props = {
  pool: PoolId;
  liquidity: number;
  lpTokenBalance: BN | undefined;
  coinAAmountToWithdraw: number;
  coinBAmountToWithdraw: number;
  coinADecimals: number;
  coinBDecimals: number;
};

const useRemoveLiquidity = ({ pool, liquidity, lpTokenBalance, coinAAmountToWithdraw, coinBAmountToWithdraw, coinADecimals, coinBDecimals }: Props) => {
  const mira = useMiraDex();
  const { wallet } = useWallet();

  const mutationFn = useCallback(async () => {
    if (!mira || !wallet || !lpTokenBalance) {
      return;
    }

    const liquidityAmount = lpTokenBalance.toNumber() * liquidity / 100;

    const coinAWithDecimals = coinAAmountToWithdraw * 10 ** coinADecimals;
    const coinBWithDecimals = coinBAmountToWithdraw * 10 ** coinBDecimals;
    const minCoinAAmount = Math.ceil(coinAWithDecimals * 0.99);
    const minCoinBAmount = Math.ceil(coinBWithDecimals * 0.99);

    const txRequest = await mira.removeLiquidity(pool, liquidityAmount, minCoinAAmount, minCoinBAmount, MaxDeadline, DefaultTxParams);
    const gasCost = await wallet.getTransactionCost(txRequest);
    const fundedTx = await wallet.fund(txRequest, gasCost);
    const tx = await wallet.sendTransaction(fundedTx, { estimateTxDependencies: true });
    return tx.waitForResult();
  }, [mira, wallet, pool, liquidity, lpTokenBalance]);

  const { data, mutateAsync, error } = useMutation({
    mutationFn,
  });

  return { data, removeLiquidity: mutateAsync, error };
};

export default useRemoveLiquidity;
