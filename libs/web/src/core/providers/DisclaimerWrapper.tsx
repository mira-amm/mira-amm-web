import {ReactNode, useCallback, useEffect} from "react";
import {ConfirmPopup} from "@/src/components/common";
import {useLocalStorage, useScrollLock} from "usehooks-ts";
import {useDisconnect, useIsConnected} from "@fuels/react";

export function DisclaimerWrapper({children}: {
  children: ReactNode;
}){
  const {lock, unlock} = useScrollLock({autoLock: false});

  const {isConnected} = useIsConnected();
  const {disconnectAsync, isPending: disconnectIsPending} = useDisconnect();

  const [accepted, setAccepted] = useLocalStorage(
    "isDisclaimerAccepted",
    false,
  );

  const handleConfirmClick = useCallback(() => {
    setAccepted(true);
  }, []);

  const handleDenyClick = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const showPopup = isConnected && !accepted;

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
          disconnectIsPending={disconnectIsPending}
        />
      )}
      {children}
    </>
  );
};
