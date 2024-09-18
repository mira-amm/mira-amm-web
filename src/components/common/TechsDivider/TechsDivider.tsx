import { DividerText } from "../DividerText/dividerText";
import { UsedTechs } from "../UsedTechs/UsedTechs";
import Halborn from "../../icons/Halborn/Halborn";
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
      <li>
        <UsedTechs text="Audited by">
          <Halborn />
        </UsedTechs>
      </li>
      <li>
        <UsedTechs text="Supported by">
          <FuelGroup />
        </UsedTechs>
      </li>
      </div>
    </Divider>
  );
};
