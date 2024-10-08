import {ReactNode, useCallback, useEffect} from "react";
import {ConfirmPopup} from "@/src/components/common/ConfirmPopup/ConfirmPopup";
import {useScrollLock} from "usehooks-ts";
import {useDisconnect, useIsConnected} from "@fuels/react";
import useSavedSignatures from "@/src/hooks/useSavedSignatures";
import useSendSignature from "@/src/hooks/useSendSignature";

type Props = {
  children: ReactNode;
};

const DisclaimerWrapper = ({ children }: Props) => {
  const { lock, unlock } = useScrollLock();

  const { isConnected } = useIsConnected();
  const { disconnectAsync, isPending: disconnectIsPending  } = useDisconnect();

  const { signatureData: existingSignatureData, isSignatureLoading, refetchSignature } = useSavedSignatures('My text');
  const { sign, signingIsPending } = useSendSignature('My text');

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
      {children}
      {showPopup && (
        <ConfirmPopup
          onConfirm={handleConfirmClick}
          onDeny={handleDenyClick}
          signIsPending={signingIsPending}
          disconnectIsPending={disconnectIsPending}
        />
      )}
    </>
  );
};

export default DisclaimerWrapper;
