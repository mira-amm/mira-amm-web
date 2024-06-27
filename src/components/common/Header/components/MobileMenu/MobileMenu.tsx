'use client';

import {useCallback, useEffect, useState} from "react";
import MenuIcon from "@/src/components/icons/Menu/MenuIcon";

import MobileMenuContent from "./components/MobileMenuContent/MobileMenuContent";
import styles from './MobileMenu.module.css';

const MobileMenu = () => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpandedState = useCallback(() => {
    setExpanded((prevState) => !prevState);
  }, []);

  useEffect(() => {
    if (expanded) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }, [expanded]);

  return (
    <>
      <button className={styles.menuButton} onClick={toggleExpandedState}>
        <MenuIcon/>
      </button>
      <MobileMenuContent expanded={expanded} toggleExpandedState={toggleExpandedState}/>
    </>
  );
};

export default MobileMenu;
