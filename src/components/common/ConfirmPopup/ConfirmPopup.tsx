import styles from "./ConfirmPopup.module.css";
import ActionButton from "../ActionButton/ActionButton";
import {FC} from "react";
import clsx from "clsx";

type ConfirmPopupProps = {
  onConfirm: VoidFunction;
  onDeny: VoidFunction;
  disconnectIsPending: boolean;
};

export const ConfirmPopup: FC<ConfirmPopupProps> = ({onConfirm, onDeny, disconnectIsPending}) => {
  return (
    <section className={styles.popupOverlay}>
      <form className={styles.popupForm}>
        <div className={styles.popupHeader}>
          <h2 className={styles.popupTitle}>Disclaimer</h2>
        </div>
        <p className={styles.popupDescription}>
          By accessing this website or using the Mira Protocol, I confirm that:
        </p>
        <ul className={styles.popupList}>
          <li className={styles.popupListItem}>
            I am not a person or entity who resides in, is a citizen
            of, is incorporated in, or has a registered office in the United
            States of America or any other Prohibited Localities, as defined in
            the{" "}
            <a
              className={styles.popupLink}
              href="https://docs.mira.ly/resources/terms-and-conditions"
              target="_blank"
            >
              Terms of Use
            </a>
            .
          </li>
          <li className={styles.popupListItem}>
            I will not access this site or use the Mira Protocol while located
            within the United States or any Prohibited Localities.
          </li>
          <li className={styles.popupListItem}>
            I am not using, and will not use in the future, a VPN or other tools
            to obscure my physical location from a restricted territory.
          </li>
          <li className={styles.popupListItem}>
            I am lawfully permitted to access this site and use the Mira Dex
            protocol under the laws of the jurisdiction in which I reside and am
            located.
          </li>
          <li className={styles.popupListItem}>
            I understand the risks associated with using decentralized
            protocols, including the Mira Protocol, as outlined in the{" "}
            <a
              className={styles.popupLink}
              href="https://docs.mira.ly/resources/terms-and-conditions"
              target="_blank"
            >
              Terms of Use
            </a>{" "}
            and{" "}
            <a
              className={styles.popupLink}
              href="https://docs.mira.ly/resources/privacy-policy"
              target="_blank"
            >
              Privacy Policy
            </a>
            .
          </li>
        </ul>
        <div className={styles.buttonWrapper}>
          <ActionButton className={clsx(styles.popupButton, styles.buttonDeny)} variant="outlined" onClick={onDeny} loading={disconnectIsPending}>
            Deny and Disconnect
          </ActionButton>
          <ActionButton className={styles.popupButton} onClick={onConfirm}>
            Sign and Confirm
          </ActionButton>
        </div>
      </form>
    </section>
  );
};
