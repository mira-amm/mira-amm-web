import {ReactNode, useCallback, useEffect} from "react";
import {ConfirmPopup} from "@/src/components/common/ConfirmPopup/ConfirmPopup";
import {useScrollLock} from "usehooks-ts";
import {useDisconnect, useIsConnected} from "@fuels/react";
import useSavedSignatures from "@/src/hooks/useSavedSignatures";
import useSendSignature from "@/src/hooks/useSendSignature";
import {DisclaimerMessage} from "@/src/utils/constants";

type Props = {
  children: ReactNode;
};

const DisclaimerWrapper = ({ children }: Props) => {
  const { lock, unlock } = useScrollLock();

  const { isConnected } = useIsConnected();
  const { disconnectAsync, isPending: disconnectIsPending  } = useDisconnect();

  // TODO: Change message to the one accepted by API
  const { signatureData: existingSignatureData, isSignatureLoading, refetchSignature } = useSavedSignatures(DisclaimerMessage);
  const { sign, signingIsPending } = useSendSignature(DisclaimerMessage);

  const handleConfirmClick = useCallback(async () => {
    await sign();
    await refetchSignature();
  }, [sign]);

  const handleDenyClick = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const showPopup = isConnected && !isSignatureLoading && !existingSignatureData;

  useEffect(() => {
    if (showPopup) {
      lock();
    } else {
      unlock();
    }
  }, [showPopup]);

  return (
    <>
      {showPopup && (
        <ConfirmPopup
          onConfirm={handleConfirmClick}
          onDeny={handleDenyClick}
          signIsPending={signingIsPending}
          disconnectIsPending={disconnectIsPending}
        />
      )}
      {children}
    </>
  );
};

export default DisclaimerWrapper;
