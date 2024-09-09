import styles from "./TechsDivider.module.css";
import { TrustMessage } from "../TrustMessage/TrustMessage";
import { UsedTechs } from "../UsedTechs/UsedTechs";
import Halborn from "../../icons/Halborn/Halborn";
import FuelGroup from "../../icons/FuelGroup/FuelGroup";

export const TechsDivider = () => {
  return (
    <ul className={styles.techsDivider}>
      <li>
        <TrustMessage />
      </li>
      <li>
        <UsedTechs text="Audited by">
          <Halborn />
        </UsedTechs>
      </li>
      <li>
        <UsedTechs text="Backed by">
          <FuelGroup />
        </UsedTechs>
      </li>
    </ul>
  );
};
