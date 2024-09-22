import { DividerText } from "../DividerText/dividerText";
import { UsedTechs } from "../UsedTechs/UsedTechs";
import Halborn from "../../icons/Halborn/HalbornIcon";
import FuelGroup from "../../icons/FuelGroup/FuelGroup";
import { Divider } from "../Divider/Divider";
import styles from "./TechsDivider.module.css";

export const TechsDivider = () => {
  return (
    <Divider className={styles.techsDivider}>
      <li>
        <DividerText text="Trade with confidence" />
      </li>
      <div className={styles.logosArea}>
        <div className={styles.scrollingContent}>
          <li>
            <UsedTechs text="Audited by">
              <a
                className={styles.TechsDividerLink}
                href="https://docs.mira.ly/developer-guides/security-audit"
              >
                <Halborn />
              </a>
            </UsedTechs>
          </li>
          <li>
            <UsedTechs text="Supported by">
              <a
                className={styles.TechsDividerLink}
                href="https://fuel.network"
              >
                <div className={styles.fuelIcon}><FuelGroup /></div>
              </a>
            </UsedTechs>
          </li>
          <li className={styles.mobileOnly}>
            <UsedTechs text="Audited by">
              <a
                className={styles.TechsDividerLink}
                href="https://docs.mira.ly/developer-guides/security-audit"
              >
                <Halborn />
              </a>
            </UsedTechs>
          </li>
          <li className={styles.mobileOnly}>
            <UsedTechs text="Supported by">
              <a
                className={styles.TechsDividerLink}
                href="https://fuel.network"
              >
                <div className={styles.fuelIcon}><FuelGroup /></div>
              </a>
            </UsedTechs>
          </li>
          <li className={styles.mobileOnly}>
            <UsedTechs text="Audited by">
              <a
                className={styles.TechsDividerLink}
                href="https://docs.mira.ly/developer-guides/security-audit"
              >
                <Halborn />
              </a>
            </UsedTechs>
          </li>
          <li className={styles.mobileOnly}>
            <UsedTechs text="Supported by">
              <a
                className={styles.TechsDividerLink}
                href="https://fuel.network"
              >
                <div className={styles.fuelIcon}><FuelGroup /></div>
              </a>
            </UsedTechs>
          </li>
          <li className={styles.mobileOnly}>
            <UsedTechs text="Audited by">
              <a
                className={styles.TechsDividerLink}
                href="https://docs.mira.ly/developer-guides/security-audit"
              >
                <Halborn />
              </a>
            </UsedTechs>
          </li>
          <li className={styles.mobileOnly}>
            <UsedTechs text="Supported by">
              <a
                className={styles.TechsDividerLink}
                href="https://fuel.network"
              >
                <div className={styles.fuelIcon}><FuelGroup /></div>
              </a>
            </UsedTechs>
          </li>
          <li className={styles.mobileOnly}>
            <UsedTechs text="Audited by">
              <a
                className={styles.TechsDividerLink}
                href="https://docs.mira.ly/developer-guides/security-audit"
              >
                <Halborn />
              </a>
            </UsedTechs>
          </li>
          <li className={styles.mobileOnly}>
            <UsedTechs text="Supported by">
              <a
                className={styles.TechsDividerLink}
                href="https://fuel.network"
              >
                <div className={styles.fuelIcon}><FuelGroup /></div>
              </a>
            </UsedTechs>
          </li>
          <li className={styles.mobileOnly}>
            <UsedTechs text="Audited by">
              <a
                className={styles.TechsDividerLink}
                href="https://docs.mira.ly/developer-guides/security-audit"
              >
                <Halborn />
              </a>
            </UsedTechs>
          </li>
          <li className={styles.mobileOnly}>
            <UsedTechs text="Supported by">
              <a
                className={styles.TechsDividerLink}
                href="https://fuel.network"
              >
                <div className={styles.fuelIcon}><FuelGroup /></div>
              </a>
            </UsedTechs>
          </li>
        </div>
      </div>
    </Divider>
  );
};
