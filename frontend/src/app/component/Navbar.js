"use client";

import { useRouter } from "next/navigation";
import styles from "../style/navbar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUser,
  faCogs,
  faSignOutAlt,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <FontAwesomeIcon icon={faGlobe} className={styles.logoIcon} />
        <span className={styles.logoText}>Welcome - KB</span>
      </div>
      <ul className={styles.navLinks}>
        <li
          onClick={() => router.push("/pages/home")}
          className={styles.navItem}
        >
          <FontAwesomeIcon icon={faHome} className={styles.icon} />
        </li>
        <li
          onClick={() => router.push("/pages/profile")}
          className={styles.navItem}
        >
          <FontAwesomeIcon icon={faUser} className={styles.icon} />
        </li>
        <li
          onClick={() => router.push("/pages/setting")}
          className={styles.navItem}
        >
          <FontAwesomeIcon icon={faCogs} className={styles.icon} />
        </li>
        <li onClick={handleLogout} className={styles.navItem}>
          <FontAwesomeIcon icon={faSignOutAlt} className={styles.icon} />
        </li>
      </ul>
    </nav>
  );
}
