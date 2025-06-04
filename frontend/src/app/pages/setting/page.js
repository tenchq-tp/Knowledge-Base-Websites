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

export default function Setting() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, toggleTheme, getThemeStyles, isDark } = useTheme();

  // เช็ค user login
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      router.push("/pages/login");
    }
  }, [router]);

  const styles = getThemeStyles();

  return (
    <div style={styles.body}>
      <Navbar />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>
            {t("settings.title")}
          </h1>
          <p style={styles.headerSubtitle}>
            {t("settings.subtitle")}
          </p>
        </div>

        {/* User Settings Section */}
        <UserSettings isDark={isDark} styles={styles} />

        {/* Role Settings Section */}
        <RoleSettings isDark={isDark} styles={styles} />

        {/* Theme Settings Section */}
        <ThemeSettings 
          isDark={isDark} 
          styles={styles} 
          toggleTheme={toggleTheme} 
        />

        {/* Language Settings Section */}
        <LanguageSettings styles={styles} />
      </div>
    </div>
  );
}