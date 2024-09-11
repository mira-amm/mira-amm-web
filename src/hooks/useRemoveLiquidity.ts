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
};

const useRemoveLiquidity = ({ pool, liquidity, lpTokenBalance }: Props) => {
  const mira = useMiraDex();
  const { wallet } = useWallet();

  const mutationFn = useCallback(async () => {
    if (!mira || !wallet || !lpTokenBalance) {
      return;
    }

    const liquidityAmount = lpTokenBalance.toNumber() * liquidity / 100;

    const txRequest = await mira.removeLiquidity(pool, liquidityAmount, 0, 0, MaxDeadline, DefaultTxParams);
    const gasCost = await wallet.getTransactionCost(txRequest);
    const fundedTx = await wallet.fund(txRequest, gasCost);
    const tx = await wallet.sendTransaction(fundedTx);
    return await tx.waitForResult();
  }, [mira, wallet, pool, liquidity, lpTokenBalance]);

  const { data, mutateAsync } = useMutation({
    mutationFn,
  });

  return { data, removeLiquidity: mutateAsync };
};

export default useRemoveLiquidity;
