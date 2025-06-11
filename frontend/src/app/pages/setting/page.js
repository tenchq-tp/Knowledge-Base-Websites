"use client";

import { useEffect, useState } from "react";
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
  const styles = getThemeStyles();

  const [canManageUser, setCanManageUser] = useState(false);
  const [canManageRole, setCanManageRole] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      router.push("/pages/login");
      return;
    }

    const permissions = JSON.parse(
      localStorage.getItem("user_permissions") || "[]"
    );

    const hasViewHome = permissions.some(
      (perm) => perm.permission?.name === "view_home"
    );
    if (!hasViewHome) {
      router.push("/pages/access-denied");
      return;
    }

    setCanManageUser(
      permissions.some((perm) => perm.permission?.name === "user_setting")
    );
    setCanManageRole(
      permissions.some((perm) => perm.permission?.name === "role_setting")
    );
  }, [router]);

  return (
    <div className="setting-page" style={styles.body}>
      <Navbar />

      <div className="setting-container">
        <header className="setting-header" style={styles.dynamicCard}>
          <h1 className="setting-title">{t("settings.title")}</h1>
          <p className="setting-subtitle">{t("settings.subtitle")}</p>
        </header>

        <div className="settings-grid">
          {canManageUser && <UserSettings />}
          {canManageRole && <RoleSettings />}
          <ThemeSettings />
          <LanguageSettings />
        </div>
      </div>
    </div>
  );
}
