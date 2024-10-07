import { clsx } from "clsx";
import { memo, useState } from "react";
import { DropDownMenu } from "../DropDownMenu/DropDownMenu";

import styles from "./MainnetLabel.module.css";
import { ArrowDownIcon } from "../../icons/ArrowDown/ArrowDownIcon";
import { ArrowUpIcon } from "../../icons/ArrowUp/ArrowUpIcon";
import { testnetLink } from "@/src/utils/constants";

type Props = {
  className?: string;
};

const MainnetLabel = ({ className }: Props) => {
  const [isMenuOpened, setIsMenuOpened] = useState(false);

  const handleClick = () => {
    setIsMenuOpened((prev) => !prev);
  };

  const menuButtons = [
    {
      text: "Testnet",
      onClick: () => {
        window.open(testnetLink, "_blank");
      },
      className: styles.selectButton
    },
  ];
  return (
    <button className={styles.labelButton} onClick={handleClick}>
      <div className={clsx(styles.mainnetLabel, className)}>
        Mainnet {!isMenuOpened ? <ArrowDownIcon /> : <ArrowUpIcon />}
      </div>
      {isMenuOpened && (
        <DropDownMenu className={styles.labelMenu} buttons={menuButtons} />
      )}
    </button>
  );
};

export default memo(MainnetLabel);