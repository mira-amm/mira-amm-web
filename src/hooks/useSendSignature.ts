import {useMutation} from "@tanstack/react-query";
import {ApiBaseUrl} from "../utils/constants";
import {useAccount, useWallet} from "@fuels/react";
import {useCallback} from "react";
import {toBech32} from "fuels";
import {calculateSHA256Hash} from "@/src/utils/common";

const useSendSignature = (message: string) => {
  const { account } = useAccount();
  const { wallet } = useWallet({ account });

  const mutationFn = useCallback(async () => {
    if (!account || !wallet) {
      return;
    }

    const address = toBech32(account);
    const signature = await wallet.signMessage(message);
    const messageHash = await calculateSHA256Hash(message);

    const response = await fetch(
      `${ApiBaseUrl}/signatures`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          msg_hash: messageHash,
          signature,
        }),
      },
    );

    return response.ok;
  }, [account, message, wallet]);

  const { data, mutateAsync, isPending } = useMutation({
    mutationFn,
  });

  return { signatureData: data, sign: mutateAsync, signingIsPending: isPending };
};

export default useSendSignature;
