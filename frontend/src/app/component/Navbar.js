"use client";
import jwtDecode from "jwt-decode";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../style/navbar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUser,
  faCogs,
  faSignOutAlt,
  faSignInAlt,
  faGlobe,
  faTachometerAlt,
  faNewspaper,
  faChevronDown,
  faChevronUp,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import "@/lib/i18n";

export default function Navbar() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [username, setUsername] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const decoded = jwtDecode(token);
        console.log("token type:", typeof token, ", token value:", token);

        const now = Date.now() / 1000;
        const expDate = new Date(decoded.exp * 1000).toLocaleString();

        if (decoded.exp < now) {
          console.log(
            "Token expired, clearing specific localStorage items and redirecting..."
          );

          // ลบแค่ key ที่ระบุไว้
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("token_type");
          localStorage.removeItem("user_data");
          localStorage.removeItem("user_id");
          localStorage.removeItem("username");
          localStorage.removeItem("user_role");
          localStorage.removeItem("is_verified");
          localStorage.removeItem("user_permissions");
          localStorage.removeItem("user_role_id");
          // ไม่ลบ session_id หรือ key อื่น ๆ

          router.push("/pages/login");
        }
      } catch (error) {
        console.error("Invalid token:", error);

        // กรณี token ไม่ถูกต้อง ลบทั้งหมดเพื่อความปลอดภัย
        localStorage.clear();
        router.push("/pages/login");
      }
    };

    checkTokenExpiration();
  }, [router]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "th";
    if (i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }

    const storedUsername = localStorage.getItem("username") || "";
    setUsername(storedUsername);
  }, [i18n]);

  useEffect(() => {
    const handleLanguageChanged = (event) => {
      if (event.detail && event.detail.language) {
        i18n.changeLanguage(event.detail.language);
        setForceUpdate((prev) => prev + 1);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === "language") {
        const newLanguage = event.newValue || "th";
        i18n.changeLanguage(newLanguage);
        setForceUpdate((prev) => prev + 1);
      }
    };

    window.addEventListener("languageChanged", handleLanguageChanged);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [i18n]);

  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        icon: "question",
        title: t("logout.confirm_title"),
        text: t("logout.confirm_text"),
        showCancelButton: true,
        confirmButtonText: t("logout.yes_logout"),
        cancelButtonText: t("logout.cancel"),
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
      });

      if (result.isConfirmed) {
        const accessToken = localStorage.getItem("access_token");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API}/auth/logout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: "",
          }
        );
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("user_data");
        localStorage.removeItem("user_id");
        localStorage.removeItem("username");
        localStorage.removeItem("user_role");
        localStorage.removeItem("is_verified");
        localStorage.removeItem("user_permissions");
        localStorage.removeItem("user_role_id");
        if (response.ok) {
          let timerInterval;
          await Swal.fire({
            icon: "success",
            title: t("logout.success_title"),
            html: `<strong>3</strong>`,
            timer: 3000,
            timerProgressBar: true,
            didOpen: () => {
              const b = Swal.getHtmlContainer().querySelector("strong");
              let countdown = 3;
              timerInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                  b.textContent = countdown.toString();
                }
              }, 1000);
            },
            willClose: () => {
              clearInterval(timerInterval);
            },
          });
        } else {
          await Swal.fire({
            icon: "warning",
            title: t("logout.warning_title"),
            text: t("logout.warning_text"),
            timer: 2000,
            timerProgressBar: true,
          });
        }

        router.push("/pages/login");
      }
    } catch (error) {
      console.error("Logout error:", error);

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("user_data");
      localStorage.removeItem("user_id");
      localStorage.removeItem("username");
      localStorage.removeItem("user_role");
      localStorage.removeItem("is_verified");
      localStorage.removeItem("user_permissions");
      localStorage.removeItem("user_role_id");
      await Swal.fire({
        icon: "error",
        title: t("logout.error_title"),
        text: t("logout.error_text"),
        confirmButtonText: "OK",
      });

      router.push("/pages/login");
    }
  };
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    const names = stored.map((p) => p.permission?.name);
    setPermissions(names);
  }, []);

  const hasPermission = (permName) => permissions.includes(permName);
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <FontAwesomeIcon icon={faGlobe} className={styles.logoIcon} />
        <span className={styles.logoText}>{t("navbar.welcome")}</span>
      </div>

      <ul className={styles.navLinks}>
        {hasPermission("view_home") && (
          <li
            onClick={() => router.push("/pages/home")}
            className={styles.navItem}
          >
            <FontAwesomeIcon icon={faHome} className={styles.icon} />
            <span className={styles.navText}>{t("navbar.home")}</span>
          </li>
        )}

        {hasPermission("view_dashboard") && (
          <li
            onClick={() => router.push("/pages/dashboard")}
            className={styles.navItem}
          >
            <FontAwesomeIcon icon={faTachometerAlt} className={styles.icon} />
            <span className={styles.navText}>{t("navbar.dashboard")}</span>
          </li>
        )}

        {hasPermission("view_category") && (
          <li
            onClick={() => router.push("/pages/category")}
            className={styles.navItem}
          >
            <FontAwesomeIcon icon={faNewspaper} className={styles.icon} />
            <span className={styles.navText}>{t("navbar.category")}</span>
          </li>
        )}

        {hasPermission("view_profile") && (
          <li
            onClick={() => router.push("/pages/profile")}
            className={styles.navItem}
          >
            <FontAwesomeIcon icon={faUser} className={styles.icon} />
            <span className={styles.navText}>{t("navbar.profile")}</span>
          </li>
        )}
        <li
          onClick={() => router.push("/pages/setting")}
          className={styles.navItem}
        >
          <FontAwesomeIcon icon={faCogs} className={styles.icon} />
          <span className={styles.navText}>{t("navbar.settings")}</span>
        </li>

        {/* Username with toggleable Logout */}
        <li className={`${styles.navItem} ${styles.userMenu}`}>
          {!username ? (
            // ถ้ายังไม่ล็อกอิน ให้แสดงปุ่ม Sign In
            <span
              className={styles.navText}
              onClick={() => router.push("/pages/login")}
            >
              <FontAwesomeIcon icon={faSignInAlt} className={styles.authIcon} />{" "}
              Sign In
            </span>
          ) : (
            // ถ้าล็อกอินแล้ว ให้แสดง username พร้อม dropdown toggle
            <span
              className={styles.navText}
              onClick={() => setShowLogoutMenu((prev) => !prev)}
            >
              <FontAwesomeIcon
                icon={faUserCircle}
                className={styles.authIcon}
              />{" "}
              {username}{" "}
              <FontAwesomeIcon
                icon={showLogoutMenu ? faChevronUp : faChevronDown}
                className={styles.chevron}
              />
            </span>
          )}

          {/* เมนู Logout */}
          {username && (
            <div
              className={`${styles.logoutDropdown} ${
                showLogoutMenu ? styles.show : ""
              }`}
            >
              <button className={styles.logoutButton} onClick={handleLogout}>
                <FontAwesomeIcon
                  icon={faSignOutAlt}
                  className={styles.logoutIcon}
                />
                {t("navbar.logout")}
              </button>
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
}
