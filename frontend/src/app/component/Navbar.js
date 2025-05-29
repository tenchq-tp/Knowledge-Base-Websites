"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import styles from "../style/navbar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUser,
  faCogs,
  faSignOutAlt,
  faGlobe,
  faTachometerAlt,
  faNewspaper,
} from "@fortawesome/free-solid-svg-icons";
import Swal from 'sweetalert2';
import '@/lib/i18n'; // Import i18n configuration (absolute path)

export default function Navbar() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Load language setting on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'th';
    
    // Set language if different from current
    if (i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  // Listen for language changes from Settings page
  useEffect(() => {
    const handleLanguageChanged = (event) => {
      console.log('Navbar: Language change event received:', event.detail);
      if (event.detail && event.detail.language) {
        i18n.changeLanguage(event.detail.language);
        // Force component re-render
        setForceUpdate(prev => prev + 1);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === 'language') {
        const newLanguage = event.newValue || 'th';
        console.log('Navbar: Storage change detected:', newLanguage);
        i18n.changeLanguage(newLanguage);
        setForceUpdate(prev => prev + 1);
      }
    };

    // Listen for custom language change events
    window.addEventListener('languageChanged', handleLanguageChanged);
    // Listen for localStorage changes from other tabs
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [i18n]);

  // Logout function ที่เรียก API /auth/logout
  const handleLogout = async () => {
    try {
      // แสดง confirmation dialog
      const result = await Swal.fire({
        icon: 'question',
        title: t('logout.confirm_title'),
        text: t('logout.confirm_text'),
        showCancelButton: true,
        confirmButtonText: t('logout.yes_logout'),
        cancelButtonText: t('logout.cancel'),
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
      });

      if (result.isConfirmed) {
        // ดึง access token จาก localStorage
        // const accessToken = localStorage.getItem('access_token');
        
        // เรียก API logout
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${accessToken}`
          }
        });

        // ไม่ว่า API จะสำเร็จหรือไม่ ก็ลบข้อมูลใน localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        localStorage.removeItem('user_role');
        localStorage.removeItem('is_verified');

        if (response.ok) {
          // API logout สำเร็จ
          await Swal.fire({
            icon: 'success',
            title: t('logout.success_title'),
            text: t('logout.success_text'),
            timer: 2000,
            timerProgressBar: true
          });
        } else {
          // API logout ไม่สำเร็จ แต่ก็ logout จาก client side
          await Swal.fire({
            icon: 'warning',
            title: t('logout.warning_title'),
            text: t('logout.warning_text'),
            timer: 2000,
            timerProgressBar: true
          });
        }

        // redirect ไปหน้า login
        router.push('/pages/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      
      // แม้จะมี error ก็ลบข้อมูลใน localStorage เพื่อความปลอดภัย
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      localStorage.removeItem('user_role');
      localStorage.removeItem('is_verified');

      await Swal.fire({
        icon: 'error',
        title: t('logout.error_title'),
        text: t('logout.error_text'),
        confirmButtonText: 'OK'
      });

      // redirect ไปหน้า login แม้จะ error
      router.push('/pages/login');
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <FontAwesomeIcon icon={faGlobe} className={styles.logoIcon} />
        <span className={styles.logoText}>{t('navbar.welcome')}</span>
      </div>
      <ul className={styles.navLinks}>
        <li
          onClick={() => router.push("/pages/home")}
          className={styles.navItem}
        >
            <FontAwesomeIcon icon={faHome} className={styles.icon} />
            <span className={styles.navText}>&nbsp;&nbsp;{t('navbar.home')}</span>
        </li>
        <li
          onClick={() => router.push("/pages/dashboard")}
          className={styles.navItem}
        >
          <FontAwesomeIcon icon={faTachometerAlt} className={styles.icon} />
          <span className={styles.navText}>&nbsp;&nbsp;{t('navbar.dashboard')}</span>
        </li>
        <li
          onClick={() => router.push("/pages/article")}
          className={styles.navItem}
        >
          <FontAwesomeIcon icon={faNewspaper} className={styles.icon} />
          <span className={styles.navText}>&nbsp;&nbsp;{t('navbar.article')}</span>
        </li>
        <li
          onClick={() => router.push("/pages/profile")}
          className={styles.navItem}
        >
          <FontAwesomeIcon icon={faUser} className={styles.icon} />
          <span className={styles.navText}>&nbsp;&nbsp;{t('navbar.profile')}</span>
        </li>
        <li
          onClick={() => router.push("/pages/setting")}
          className={styles.navItem}
        >
          <FontAwesomeIcon icon={faCogs} className={styles.icon} />
         <span className={styles.navText}>&nbsp;&nbsp;{t('navbar.settings')}</span>
        </li>
        <li onClick={handleLogout} className={styles.navItem}>
          <FontAwesomeIcon icon={faSignOutAlt} className={styles.icon} />
            <span className={styles.navText}>&nbsp;&nbsp;{t('navbar.logout')}</span>
        </li>
      </ul>
      
    </nav>
  );
}