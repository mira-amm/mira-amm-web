"use client";

import {useCallback, useState} from "react";
import {useScrollLock} from "usehooks-ts";
import MenuIcon from "@/src/components/icons/Menu/MenuIcon";

import MobileMenuContent from "./components/MobileMenuContent/MobileMenuContent";
import styles from "./MobileMenu.module.css";

const MobileMenu = () => {
  const [expanded, setExpanded] = useState(false);

  const {lock, unlock} = useScrollLock({autoLock: false});

  const toggleExpandedState = useCallback(() => {
    setExpanded(!expanded);
    if (expanded) {
      unlock();
    } else {
      lock();
    }
  }, [expanded, unlock, lock]);

  return (
    <>
      <button className={styles.menuButton} onClick={toggleExpandedState}>
        <MenuIcon />
      </button>
      <MobileMenuContent
        expanded={expanded}
        toggleExpandedState={toggleExpandedState}
      />
    </>
  );
};

export default MobileMenu;
