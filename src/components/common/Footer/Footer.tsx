import Logo from "@/src/components/common/Logo/Logo";
import { BlogLink, DiscordLink, TestnetUrl, XLink } from "@/src/utils/constants";

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
          <p className={styles.fuelText}>&#8432;MIRA launched as a basic AMM and will transition to ve(3,3) soon</p>
            {/* <FuelIcon /> */}
          </div>
          <div className={styles.links}>
            <a className={styles.link} href={DiscordLink}>
              Support
            </a>
            {/* <a href="/" target="_blank">
              Partner with us
            </a> */}
            <a href="https://docs.mira.ly/resources/media-kit" target="_blank">
              Media Kit
            </a>
            <a href="https://docs.mira.ly" target="_blank">
              Docs
            </a>
            <a href={BlogLink} target="_blank">
              Blog
            </a>
            <a href="mailto:hi@mira.ly" target="_blank">
              Contact us
            </a>
          </div>
          <div className={styles.socialLinks}>
            <a href="https://github.com/mira-amm" target="_blank">
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
            <a className={styles.link} href={DiscordLink}>
              Support
            </a>
            {/* <a href="/" target="_blank">
              Partner with us
            </a> */}
            <a className={styles.link} href="https://docs.mira.ly/resources/media-kit" target="_blank">
              Media Kit
            </a>
            <a className={styles.link} href="https://docs.mira.ly/developer-guides/security-audit" target="_blank">
            Security Audit 
            </a>
            <a className={styles.link} href="https://docs.mira.ly" target="_blank">
              Docs
            </a>
            <a className={styles.link} href={BlogLink} target="_blank">
              Blog
            </a>
            <a className={styles.link} href="mailto:hi@mira.ly" target="_blank">
              Contact us
            </a>
          </div>
          <div className={styles.socialLinks}>
            <a className={styles.socialLink} href="https://github.com/mira-amm" target="_blank">
              <Github />
            </a>
            <a className={styles.socialLink} href={DiscordLink} target="_blank">
              <DiscordIcon />
            </a>
            <a className={styles.socialLink} href={XLink} target="_blank">
              <X />
            </a>
          </div>
        </div>
        <div className={styles.copywright}>
          <div className={styles.fuelWrapper}>
            <p className={styles.fuelText}>&#8432;MIRA launched as a basic AMM and will transition to ve(3,3) soon</p>
            {/* <FuelIcon /> */}
          </div>
          <p className="desktopOnly">&copy; {currentYear} Mira Finance</p>
        </div>
        <p className="mobileOnly">&copy; {currentYear} Mira Finance</p>
      </footer>
    </>
  );
};

export default Footer;
