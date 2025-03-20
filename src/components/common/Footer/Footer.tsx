import Logo from "@/src/components/common/Logo/Logo";
import { BlogLink, DiscordLink, XLink } from "@/src/utils/constants";

import styles from "./Footer.module.css";
import clsx from "clsx";
import GithubIcon from "../../icons/Github/GithubIcon";
import DiscordIcon from "../../icons/DiscordIcon/DiscordIcon";
import X from "../../icons/X/XSocialIcon";

interface FooterProps {
  isHomePage?: boolean;
}

const Footer = ({ isHomePage = false }: FooterProps) => {

  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footerLayout}>
      <div className={styles.footerContainer}>
        <div className={clsx("mobileOnly", styles.footer)}>
          <div className={styles.content}>
            <Logo isFooter={true} />
            <div className={styles.linksAndSocial}>
              <div className={styles.links}>
                <a className={styles.link} href={DiscordLink}>
                  Support
                </a>
                <a href="https://docs.mira.ly/resources/media-kit" target="_blank">
                  Media Kit
                </a>
                <a href="https://docs.mira.ly" target="_blank">
                  Docs
                </a>
                <a href={BlogLink} target="_blank">
                  Blog
                </a>
                <a href="https://docs.mira.ly/resources/careers" target="_blank">
                  Careers
                </a>
                <a href="mailto:help@mira.ly" target="_blank">
                  Contact us
                </a>
              </div>
              <div className={styles.socialLinks}>
                <a
                  className={styles.socialLink}
                  href="https://github.com/mira-amm"
                  target="_blank"
                >
                  <GithubIcon />
                </a>
                <a className={styles.socialLink} href={DiscordLink} target="_blank">
                  <DiscordIcon />
                </a>
                <a className={styles.socialLink} href={XLink} target="_blank">
                  <X />
                </a>
              </div>
            </div>
          </div>
          <div className={styles.copyright}>
            <p className="mobileOnly">&copy; {currentYear} Mira Finance</p>
          </div>
        </div>
        <div className={clsx("desktopOnly", styles.footer)}>
          <div className={styles.content}>
            <Logo isFooter={true} />
            <div className={styles.linksAndSocial}>
              <div className={styles.links}>
                <a className={styles.link} href={DiscordLink}>
                  Support
                </a>
                <a
                  className={styles.link}
                  href="https://docs.mira.ly/resources/media-kit"
                  target="_blank"
                >
                  Media Kit
                </a>
                <a
                  className={styles.link}
                  href="https://docs.mira.ly/developer-guides/security-audit"
                  target="_blank"
                >
                  Security Audit
                </a>
                <a
                  className={styles.link}
                  href="https://docs.mira.ly"
                  target="_blank"
                >
                  Docs
                </a>
                <a className={styles.link} href={BlogLink} target="_blank">
                  Blog
                </a>
                <a
                  className={styles.link}
                  href="https://docs.mira.ly/resources/careers"
                  target="_blank"
                >
                  Careers
                </a>
                <a
                  className={styles.link}
                  href="mailto:help@mira.ly"
                  target="_blank"
                >
                  Contact us
                </a>
              </div>
              <div className={styles.socialLinks}>
                <a
                  className={styles.socialLink}
                  href="https://github.com/mira-amm"
                  target="_blank"
                >
                  <GithubIcon />
                </a>
                <a className={styles.socialLink} href={DiscordLink} target="_blank">
                  <DiscordIcon />
                </a>
                <a className={styles.socialLink} href={XLink} target="_blank">
                  <X />
                </a>
              </div>
            </div>
          </div>
          <div className={styles.copyright}>
            <p className="desktopOnly">&copy; {currentYear} Mira Finance</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
