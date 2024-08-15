import Logo from "@/src/components/common/Logo/Logo";
import {DiscordLink, XLink} from "@/src/utils/constants";

import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.divider} />
      <section className={styles.content}>
        <Logo/>
        <div className={styles.links}>
          {/*<a href={DiscordLink} className="desktopOnly" target="_blank">Discord</a>*/}
          {/*<a href="#">Github</a>*/}
          {/*<a href={XLink} className="desktopOnly" target="_blank">X</a>*/}
          {/*<a href="#">Article</a>*/}
          {/*<a href="#">Docs</a>*/}
        </div>
        <p className="desktopOnly">&copy; {currentYear} Mira Finance</p>
      </section>
      <p className="mobileOnly">&copy; {currentYear} Mira Finance</p>
    </footer>
  )
};

export default Footer;
