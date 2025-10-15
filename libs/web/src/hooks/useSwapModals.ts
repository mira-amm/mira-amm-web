import {useModal} from "@/src/hooks";

export function useSwapModals() {
  const [SettingsModal, openSettingsModal, closeSettingsModal] = useModal();
  const [CoinsModal, openCoinsModal, closeCoinsModal] = useModal();
  const [SuccessModal, openSuccess] = useModal();
  const [FailureModal, openFailure, closeFailureModal] = useModal();

  return {
    SettingsModal,
    openSettingsModal,
    closeSettingsModal,
    CoinsModal,
    openCoinsModal,
    closeCoinsModal,
    SuccessModal,
    openSuccess,
    FailureModal,
    openFailure,
    closeFailureModal,
  };
}
