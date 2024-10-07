import { clsx } from "clsx";
import { memo, useState } from "react";
import { DropDownMenu } from "../DropDownMenu/DropDownMenu";

import styles from "./TestnetLabel.module.css";
import { ArrowDownIcon } from "../../icons/ArrowDown/ArrowDownIcon";
import { ArrowUpIcon } from "../../icons/ArrowUp/ArrowUpIcon";
import { mainnetLink } from "@/src/utils/constants";

type Props = {
  className?: string;
};

const TestnetLabel = ({ className }: Props) => {
  const [isMenuOpened, setIsMenuOpened] = useState(false);

  const handleClick = () => {
    setIsMenuOpened((prev) => !prev);
  };

  const menuButtons = [
    {
      text: "Mainnet",
      onClick: () => {
        window.open(mainnetLink, "_blank");
      },
    },
  ];
  return (
    <button className={styles.labelButton} onClick={handleClick}>
      <div className={clsx(styles.testnetLabel, className)}>
        Testnet {!isMenuOpened ? <ArrowDownIcon /> : <ArrowUpIcon />}
      </div>
      {isMenuOpened && (
        <DropDownMenu className={styles.labelMenu} buttons={menuButtons} />
      )}
    </button>
  );
};

export default memo(TestnetLabel);
