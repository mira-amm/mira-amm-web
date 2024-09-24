import styles from "./BlockedCountryPage.module.css";
import { GithubLink } from "@/src/utils/constants";
import { DiscordLink } from "@/src/utils/constants";
import { XLink } from "@/src/utils/constants";
import GithubIcon from "../../icons/Github/GithubIcon";
import DiscordIcon from "../../icons/DiscordIcon/DiscordIcon";
import XSocialIcon from "../../icons/X/XSocialIcon";

export const BlockedCountryPage = () => {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.iconWrapper}>
            <div className={styles.crossPart1}></div>
            <div className={styles.crossPart2}></div>
        </div>
        <ul className={styles.popupText}>
          <li>
            <h2 className={styles.popupTitle}>Access Restricted</h2>
          </li>
          <li>
            <p className={styles.popupDescription}>
              <span className={styles.popupDomain}>Mira.ly</span> is not available in
              your location due to adherence to local regulations
              or infringement of our Terms of Use
            </p>
          </li>
        </ul>
        <ul className={styles.popupLinks}>
          <li><a className={styles.popupLink} href={GithubLink} target="_blank"><GithubIcon /></a></li>
          <li><a className={styles.popupLink} href={DiscordLink} target="_blank"><DiscordIcon /></a></li>
          <li><a className={styles.popupLink} href={XLink} target="_blank"><XSocialIcon/></a></li>
        </ul>
      </div>
    </div>
  );
};
