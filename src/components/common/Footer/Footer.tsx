import Logo from "@/src/components/common/Logo/Logo";
import { DiscordLink, XLink } from "@/src/utils/constants";

import styles from "./Footer.module.css";
import { FuelIcon } from "../../icons";
import Github from "../../icons/Github/Github";
import DiscordIcon from "../../icons/DiscordIcon/DiscordIcon";
import X from "../../icons/X/X";
import clsx from "clsx";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className={clsx("mobileOnly", styles.footer)}>
        <div className={styles.content}>
          <Logo />
          <div className={styles.fuelWrapper}>
            <p className={styles.fuelText}>*Built with love on Fuel</p>
            <FuelIcon />
          </div>
          <div className={styles.links}>
            <a className={styles.supportLink} href="/">
              Support
            </a>
            <a href="/" target="_blank">
              Partner with us
            </a>
            <a href="/" target="_blank">
              Documentation
            </a>
            <a href="/" target="_blank">
              Contact us
            </a>
          </div>
          <div className={styles.socialLinks}>
            <a href="/" target="_blank">
              <Github />
            </a>
            <a href={DiscordLink} target="_blank">
              <DiscordIcon />
            </a>
            <a href={XLink} target="_blank">
              <X />
            </a>
          </div>
        </div>
        <div className={styles.copywright}>
          <p className="desktopOnly">&copy; {currentYear} Mira Finance</p>
        </div>
        <p className="mobileOnly">&copy; {currentYear} Mira Finance</p>
      </footer>
      <footer className={clsx("desktopOnly", styles.footer)}>
        <div className={styles.content}>
          <Logo />
          <div className={styles.links}>
            <a className={styles.supportLink} href="/">
              Support
            </a>
            <a href="/" target="_blank">
              Partner with us
            </a>
            <a href="/" target="_blank">
              Documentation
            </a>
            <a href="/" target="_blank">
              Contact us
            </a>
          </div>
          <div className={styles.socialLinks}>
            <a href="/" target="_blank">
              <Github />
            </a>
            <a href={DiscordLink} target="_blank">
              <DiscordIcon />
            </a>
            <a href={XLink} target="_blank">
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
    </>
  );
};

export default Footer;
