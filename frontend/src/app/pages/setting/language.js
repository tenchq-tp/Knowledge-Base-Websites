// components/LanguageSettings.js
"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useTheme } from "../../contexts/ThemeContext";
import "../../style/language_setting.css";

export default function LanguageSettings() {
  const { t, i18n } = useTranslation();
  const { tokens } = useTheme();

  const [userSettings, setUserSettings] = useState(() => {
    try {
      const lang = localStorage.getItem("language");
      return { language: lang || "en" };
    } catch {
      return { language: "en" };
    }
  });

  const handleInputChange = async (field, value) => {
    setUserSettings((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Change language immediately when new language is selected
    if (field === "language") {
      try {
        await i18n.changeLanguage(value);

        // บันทึกใน localStorage
        localStorage.setItem("language", value);

        // Dispatch custom event เพื่อแจ้ง components อื่นๆ ให้อัพเดท
        window.dispatchEvent(
          new CustomEvent("languageChanged", {
            detail: { language: value },
          })
        );

        // แสดงข้อความสำเร็จ
        await Swal.fire({
          icon: "success",
          title: t("settings.language.successTitle"),
          text: `${t("settings.language.successText", {
            language: t(`settings.language.languageNames.${value}`),
          })}`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error changing language:", error);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to change language. Please try again.",
          confirmButtonText: "OK",
        });
      }
    }
  };

  return (
    <div
      className="language-setting-card"
      style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
    >
      <div
        className="section-header"
        style={{ borderBottomColor: tokens.borderLight }}
      >
        <FontAwesomeIcon icon={faLanguage} className="section-icon" />
        <h2 className="section-title" style={{ color: tokens.text }}>
          {t("settings.language.title")}
        </h2>
      </div>

      <div className="language-content">
        <div className="language-selector-group">
          <label className="language-label" style={{ color: tokens.text }}>
            {t("settings.language.select")}
          </label>
          <select
            value={userSettings.language}
            onChange={(e) => handleInputChange("language", e.target.value)}
            className="language-select"
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.text,
            }}
          >
            <option value="th">ไทย</option>
            <option value="en">English</option>
            <option value="zh">中文 (Chinese)</option>
            <option value="ja">日本語 (Japanese)</option>
            <option value="ko">🇰🇷 한국어 (Korean)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
