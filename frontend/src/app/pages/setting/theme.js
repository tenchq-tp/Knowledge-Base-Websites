// components/ThemeSettings.js
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";

export default function ThemeSettings({ isDark, styles, toggleTheme }) {
  const { t } = useTranslation();

  const handleThemeToggle = () => {
    toggleTheme(); // ใช้จาก context

    Swal.fire({
      icon: "success",
      title: t("settings.success.title"),
      text: isDark ? t("settings.theme.switchedToLight") : t("settings.theme.switchedToDark"),
      timer: 1500,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  };

  return (
    <div style={styles.card}>
      <div style={styles.sectionHeader}>
        <FontAwesomeIcon
          icon={faPalette}
          style={{
            fontSize: "1.5rem",
            color: "#4a90e2",
            marginRight: "0.75rem",
          }}
        />
        <h2 style={styles.sectionTitle}>
          {t("settings.theme.title")}
        </h2>
      </div>

      <div style={styles.flexColumn}>
        <div style={styles.flexBetween}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FontAwesomeIcon
              icon={isDark ? faMoon : faSun}
              style={{
                fontSize: "1.2rem",
                color: isDark ? "#4a90e2" : "#FFA500",
                transition: "color 0.3s ease",
              }}
            />
            <span style={styles.text}>
              {t(isDark ? "settings.theme.darkMode" : "settings.theme.lightMode")}
            </span>
          </div>

          {/* Toggle Switch */}
          <div
            onClick={handleThemeToggle}
            style={{
              width: "60px",
              height: "30px",
              borderRadius: "15px",
              backgroundColor: isDark ? "#4a90e2" : "#ccc",
              position: "relative",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                backgroundColor: "white",
                position: "absolute",
                top: "2px",
                left: isDark ? "32px" : "2px",
                transition: "left 0.3s ease",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon
                icon={isDark ? faMoon : faSun}
                style={{
                  fontSize: "0.8rem",
                  color: isDark ? "#4a90e2" : "#FFA500",
                }}
              />
            </div>
          </div>
        </div>

        <div style={styles.backgroundSecondary}>
        </div>
      </div>
    </div>
  );
}