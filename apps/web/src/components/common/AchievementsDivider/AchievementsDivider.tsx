import {DividerText} from "../DividerText/dividerText";
import {Divider} from "../Divider/Divider";
import styles from "./AchievementsDivider.module.css";

export const AchievementsDivider = () => {
  return (
    <Divider className={styles.divider}>
      <DividerText text="The next-generation AMM for Fuel" />
    </Divider>
  );
};
