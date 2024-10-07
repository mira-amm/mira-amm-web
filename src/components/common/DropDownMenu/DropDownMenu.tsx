import React from "react";
import styles from "./DropDownMenu.module.css";
import clsx from "clsx";

type DropDownMenuProps = {
  buttons: { icon?: React.FC; text: string; onClick: () => void; disabled?: boolean; tooltip?: string, className?: string }[];
  children?: React.ReactNode;
  className?: string;
};

export const DropDownMenu = ({ buttons, children, className }: DropDownMenuProps) => {
  return (
    <>
      <ul className={clsx(styles.menuList, className)}>
        {buttons.map((button) => (
          <li key={button.text}>
            <button className={clsx(button.disabled ? styles.menuButtonDisabled : styles.menuButton)} onClick={button.onClick}>
              {button.icon && <button.icon />}
              <span>{button.text}</span>
              {button.disabled && button.tooltip && (
              <div className={styles.tooltip}>{button.tooltip}</div>
            )}
            </button>
          </li>
        ))}
        {children && <div>{children}</div>}
      </ul>
    </>
  );
};
