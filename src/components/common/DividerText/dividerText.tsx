import styles from "./dividerText.module.css";
import { DividerTextProps } from "./DividerTextProps";

export const DividerText: React.FC<DividerTextProps> = ({text}) => {
    return <p className={styles.dividerText}>
        {text}
    </p>
}