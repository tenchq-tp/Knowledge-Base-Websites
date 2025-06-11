"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../style/dashboard.module.css";
import { FaUsers, FaChartBar, FaFolderOpen } from "react-icons/fa";
import Navbar from "../../component/Navbar"; // ✅ import Navbar

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const permissions = JSON.parse(
      localStorage.getItem("user_permissions") || "[]"
    );
    const hasViewDashboard = permissions.some(
      (perm) => perm.permission?.name === "view_dashboard"
    );

    if (!hasViewDashboard) {
      router.push("/pages/access-denied");
    }
  }, [router]);

  return (
    <>
      <Navbar /> {/* ✅ ครอบด้วย Navbar */}
      <div className={styles.dashboardContainer}>
        <h1 className={styles.title}>📊 Dashboard</h1>
        <p className={styles.subtitle}>Welcome-KB Dashboard</p>

        <div className={styles.cardsContainer}>
          <div className={styles.card}>
            <FaUsers className={styles.cardIcon} />
            <div>
              <h3 className={styles.cardTitle}>Users</h3>
              <p className={styles.cardValue}>132</p>
            </div>
          </div>

          <div className={styles.card}>
            <FaChartBar className={styles.cardIcon} />
            <div>
              <h3 className={styles.cardTitle}>Analytics</h3>
              <p className={styles.cardValue}>89%</p>
            </div>
          </div>

          <div className={styles.card}>
            <FaFolderOpen className={styles.cardIcon} />
            <div>
              <h3 className={styles.cardTitle}>Projects</h3>
              <p className={styles.cardValue}>17</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
