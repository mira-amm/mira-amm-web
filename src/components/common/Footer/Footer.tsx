import Logo from "@/src/components/common/Logo/Logo";
import {DiscordLink, XLink} from "@/src/utils/constants";

import styles from './Footer.module.css';
import { FuelIcon } from "../../icons";
import Github from "../../icons/Github/Github";
import DiscordIcon from "../../icons/DiscordIcon/DiscordIcon";
import X from "../../icons/X/X";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <Logo/>
        <div className={styles.links}>
          <a className={styles.supportLink} href="/">Support</a>
          <a href="/">Partner with us</a>
          <a href="/">Documentation</a>
          <a href="/">Contact us</a>
        </div>
        <div className={styles.socialLinks}>
          <a href="/">
          <Github />
          </a>
          <a href={DiscordLink}>
            <DiscordIcon />
          </a>
          <a href={XLink}>
            <X />
          </a>
        </div>
      </div>
      <div className={styles.copywright}>
          <div className={styles.fuelWrapper}>
            <p className={styles.fuelText}>*Built with love on Fuel</p>
          <FuelIcon />
          </div>
        <p className="desktopOnly">&copy; {currentYear} Mira Finance</p>
        </div>
      <p className="mobileOnly">&copy; {currentYear} Mira Finance</p>
    </footer>
  )
};

export default Footer;