// components/ThemeSettings.js
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useTheme } from "../../contexts/ThemeContext";
import "../../style/theme_setting.css";


export default function ThemeSettings( ) {
  const { t } = useTranslation();
  const { isDark, tokens, toggleTheme } = useTheme(); 

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
    <div className="theme-setting-card" style={{ 
      backgroundColor: tokens.surface, 
      borderColor: tokens.border 
    }}>
      <div className="section-header" style={{ borderBottomColor: tokens.borderLight }}>
        <FontAwesomeIcon icon={faPalette} className="section-icon" />
        <h2 className="section-title" style={{ color: tokens.text }}>
          {t("settings.theme.title") || "Theme Setting"}
        </h2>
      </div>

      <div className="theme-content">
        <div className="theme-toggle-row">
          <div className="theme-status">
            <FontAwesomeIcon
              icon={isDark ? faMoon : faSun}
              style={{
                fontSize: "1.2rem",
                color: isDark ? "#4a90e2" : "#FFA500",
                transition: "color 0.3s ease",
              }}
            />
            <span className="theme-label" style={{ color: tokens.text }}>
              {t(isDark ? "settings.theme.darkMode" : "settings.theme.lightMode") || 
               (isDark ? "Dark Mode" : "Light Mode")}
            </span>
          </div>
          
           <div
            onClick={handleThemeToggle}
            className="theme-toggle-switch"
            tabIndex={0}
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <div className="toggle-slider">
              <FontAwesomeIcon
                icon={isDark ? faMoon : faSun}
                className="slider-icon"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}