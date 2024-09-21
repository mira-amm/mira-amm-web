import styles from "./DropDownMenu.module.css";

type DropDownMenuProps = {
  buttons: { icon: React.FC; text: string; onClick: () => void }[];
};

export const DropDownMenu = ({ buttons }: DropDownMenuProps) => {
  return (
    <ul className={styles.menuList}>
      {buttons.map((button) => (
        <li key={button.text}>
          <button className={styles.menuButton} onClick={button.onClick}>
            <button.icon />
            <span>{button.text}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};
