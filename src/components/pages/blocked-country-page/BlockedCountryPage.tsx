"use client";

import styles from "./BlockedCountryPage.module.css";
import { DiscordLink } from "@/src/utils/constants";
import { XLink } from "@/src/utils/constants";
import DiscordIcon from "../../icons/DiscordIcon/DiscordIcon";
import XSocialIcon from "../../icons/X/XSocialIcon";
import LandingPageLayout from "../landing-page/LandingPageLayout";

export const BlockedCountryPage = () => {
  return (
    <section className={styles.page}>
      <LandingPageLayout />
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
                Mira.ly is not available in your location due to adherence to
                local regulations or infringement of our{" "}
                <a
                  className={styles.textLink}
                  href="https://mira.ly/terms"
                  target="_blank"
                >
                  Terms of Use
                </a>
              </p>
            </li>
          </ul>
          <ul className={styles.popupLinks}>
            <li>
              <a
                className={styles.popupLink}
                href={DiscordLink}
                target="_blank"
              >
                <DiscordIcon />
              </a>
            </li>
            <li>
              <a className={styles.popupLink} href={XLink} target="_blank">
                <XSocialIcon />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
