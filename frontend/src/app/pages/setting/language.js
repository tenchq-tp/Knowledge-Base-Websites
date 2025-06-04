// components/LanguageSettings.js
"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";

export default function LanguageSettings({ styles }) {
  const { t, i18n } = useTranslation();
  const [userSettings, setUserSettings] = useState({ 
    language: localStorage.getItem("language") || "th" 
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
          title: "Success",
          text: `Language changed to ${
            value === "th"
              ? "Thai"
              : value === "en"
              ? "English"
              : value === "zh"
              ? "Chinese"
              : value === "ja"
              ? "Japanese"
              : "Korean"
          }`,
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
    <div style={styles.card}>
      <div style={styles.sectionHeader}>
        <FontAwesomeIcon
          icon={faLanguage}
          style={{
            fontSize: "1.5rem",
            color: "#4a90e2",
            marginRight: "0.75rem",
          }}
        />
        <h2 style={styles.sectionTitle}>
          {t("settings.language.title")}
        </h2>
      </div>

      <div style={styles.flexColumn}>
        <div style={styles.flexColumn}>
          <label style={styles.label}>
            {t("settings.language.select")}
          </label>
          <select
            value={userSettings.language}
            onChange={(e) => handleInputChange("language", e.target.value)}
            style={styles.select}
          >
            <option value="th">Thai</option>
            <option value="en">English</option>
            <option value="zh">中文 (Chinese)</option>
            <option value="ja">日本語 (Japanese)</option>
            <option value="ko">한국어 (Korean)</option>
          </select>
        </div>
      </div>
    </div>
  );
}