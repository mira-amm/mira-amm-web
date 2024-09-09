import styles from "./Divider.module.css"
import { DividerProps } from "./DividerProps"

export const Divider: React.FC<DividerProps> = ({children}) => {
    return <ul className={styles.divider}>
        {children}
    </ul>
}