import React from "react"
import styles from "./UsedTechs.module.css"
import { UsedTechsProps } from "./UsedTechsProps"

export const UsedTechs: React.FC<UsedTechsProps> = ({text, children}) => {
    return <figure className={styles.usedTechs}>
    <figcaption className={styles.text}>{text}</figcaption>
    {children}
    </figure>
}