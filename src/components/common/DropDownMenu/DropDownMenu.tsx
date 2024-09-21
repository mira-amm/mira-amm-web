import React from "react";
import styles from "./DropDownMenu.module.css";

type DropDownMenuProps = {
  buttons: { icon: React.FC; text: string; onClick: () => void }[];
  children?: React.ReactNode;
};

export const DropDownMenu = ({ buttons, children }: DropDownMenuProps) => {
  return (
    <>
      <ul className={styles.menuList}>
        {buttons.map((button) => (
          <li key={button.text}>
            <button className={styles.menuButton} onClick={button.onClick}>
              <button.icon />
              <span>{button.text}</span>
            </button>
          </li>
        ))}
        {children && <div>{children}</div>}
      </ul>
    </>
  );
};
