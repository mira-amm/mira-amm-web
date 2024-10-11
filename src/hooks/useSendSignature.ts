import {useMutation} from "@tanstack/react-query";
import {ApiBaseUrl} from "../utils/constants";
import {useAccount, useCurrentConnector, useWallet} from "@fuels/react";
import {useCallback} from "react";
import {Account, FuelConnector, toBech32} from "fuels";
import {calculateSHA256Hash} from "@/src/utils/common";
import { hasSignMessageCustomCurve } from "@fuels/connectors";

const signMessage = async (wallet: Account, connector: FuelConnector | null, message: string) => {
  if (hasSignMessageCustomCurve(connector)) {
    return connector.signMessageCustomCurve(message);
  } else if (connector) {
    return wallet.signMessage(message);
  }
  return null;
}

const useSendSignature = (message: string) => {
  const { account } = useAccount();
  const { wallet } = useWallet({ account });
  const { currentConnector } = useCurrentConnector();

  const mutationFn = useCallback(async () => {
    if (!account || !wallet) {
      return;
    }

    const address = toBech32(account);
    const signature = await signMessage(wallet, currentConnector, message);
    const messageHash = await calculateSHA256Hash(message);

    console.log(signature);
    console.log(messageHash);

    // const response = await fetch(
    //   `${ApiBaseUrl}/signatures`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       address,
    //       msg_hash: messageHash,
    //       signature,
    //     }),
    //   },
    // );

    // return response.ok;
  }, [account, message, wallet]);

  const { data, mutateAsync, isPending } = useMutation({
    mutationFn,
  });

  return { signatureData: data, sign: mutateAsync, signingIsPending: isPending };
};

export default useSendSignature;
