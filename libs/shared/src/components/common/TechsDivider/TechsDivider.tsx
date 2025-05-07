import {DividerText} from "../DividerText/dividerText";
import {UsedTechs} from "../UsedTechs/UsedTechs";
import Halborn from "../../icons/Halborn/HalbornIcon";
import FuelGroup from "../../icons/FuelGroup/FuelGroup";
import {Divider} from "../Divider/Divider";
import styles from "./TechsDivider.module.css";
import OttersecIcon from "@/src/components/icons/Ottersec/OttersecIcon";

export const TechsDivider = () => {
  return (
    <Divider className={styles.techsDivider}>
      <DividerText text="Trade with confidence" dimmed />
      <div className={styles.logosArea}>
        <div className={styles.scrollingContent}>
          <UsedTechs text="Audited by">
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <OttersecIcon />
            </a>
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <Halborn />
            </a>
          </UsedTechs>
          <UsedTechs text="Supported by">
            <a
              className={styles.TechsDividerLink}
              href="https://fuel.network"
              target="_blank"
            >
              <div className={styles.fuelIcon}>
                <FuelGroup />
              </div>
            </a>
          </UsedTechs>
          <UsedTechs text="Audited by" className={styles.mobileOnly}>
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <OttersecIcon />
            </a>
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <Halborn />
            </a>
          </UsedTechs>
          <UsedTechs text="Supported by" className={styles.mobileOnly}>
            <a
              className={styles.TechsDividerLink}
              href="https://fuel.network"
              target="_blank"
            >
              <div className={styles.fuelIcon}>
                <FuelGroup />
              </div>
            </a>
          </UsedTechs>
          <UsedTechs text="Audited by" className={styles.mobileOnly}>
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <OttersecIcon />
            </a>
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <Halborn />
            </a>
          </UsedTechs>
          <UsedTechs text="Supported by" className={styles.mobileOnly}>
            <a
              className={styles.TechsDividerLink}
              href="https://fuel.network"
              target="_blank"
            >
              <div className={styles.fuelIcon}>
                <FuelGroup />
              </div>
            </a>
          </UsedTechs>
          <UsedTechs text="Audited by" className={styles.mobileOnly}>
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <OttersecIcon />
            </a>
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <Halborn />
            </a>
          </UsedTechs>
          <UsedTechs text="Supported by" className={styles.mobileOnly}>
            <a
              className={styles.TechsDividerLink}
              href="https://fuel.network"
              target="_blank"
            >
              <div className={styles.fuelIcon}>
                <FuelGroup />
              </div>
            </a>
          </UsedTechs>
          <UsedTechs text="Audited by" className={styles.mobileOnly}>
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <OttersecIcon />
            </a>
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <Halborn />
            </a>
          </UsedTechs>
          <UsedTechs text="Supported by" className={styles.mobileOnly}>
            <a
              className={styles.TechsDividerLink}
              href="https://fuel.network"
              target="_blank"
            >
              <div className={styles.fuelIcon}>
                <FuelGroup />
              </div>
            </a>
          </UsedTechs>
          <UsedTechs text="Audited by" className={styles.mobileOnly}>
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <OttersecIcon />
            </a>
            <a
              className={styles.TechsDividerLink}
              href="https://docs.mira.ly/developer-guides/security-audit"
              target="_blank"
            >
              <Halborn />
            </a>
          </UsedTechs>
          <UsedTechs text="Supported by" className={styles.mobileOnly}>
            <a
              className={styles.TechsDividerLink}
              href="https://fuel.network"
              target="_blank"
            >
              <div className={styles.fuelIcon}>
                <FuelGroup />
              </div>
            </a>
          </UsedTechs>
        </div>
      </div>
    </Divider>
  );
};
