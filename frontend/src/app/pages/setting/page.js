// pages/setting/page.js (Refactored)
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../component/Navbar";
import UserSettings from "./user";
import RoleSettings from "./role";
import ThemeSettings from "./theme";
import LanguageSettings from "./language";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import "../../../lib/i18n";
import "../../style/setting.css";

export default function Setting() {
  const router = useRouter();
  const { t } = useTranslation();
  const { getThemeStyles } = useTheme();

  // เช็ค user login
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      router.push("/pages/login");
    }
  }, [router]);

  const styles = getThemeStyles();

  return (
    <div className="setting-page" style={styles.body}>
      <Navbar />

      <div className="setting-container">
        <header className="setting-header" style={styles.dynamicCard}>
          <h1 className="setting-title">
            {t("settings.title")}
          </h1>
          <p className="setting-subtitle">
            {t("settings.subtitle")}
          </p>
        </header>

        <div className="settings-grid">
          <UserSettings /> 
          <RoleSettings />
          <ThemeSettings />
          <LanguageSettings />
        </div>
      </div>
    </div>
  );
}
