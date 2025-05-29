// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  th: {
    translation: {
      navbar: {
        welcome: "ยินดีต้อนรับ - KB",
        home: "หน้าแรก",
        dashboard: "แดชบอร์ด", 
        article: "บทความ",
        profile: "โปรไฟล์",
        settings: "การตั้งค่า",
        logout: "ออกจากระบบ"
      },
   settings: {
        title: "การตั้งค่า",
        subtitle: "จัดการการตั้งค่าบัญชีและการกำหนดค่าของคุณ",
        user: {
          title: "การตั้งค่าผู้ใช้",
          username: "ชื่อผู้ใช้",
          email: "อีเมล",
          firstName: "ชื่อจริง",
          lastName: "นามสกุล",
          edit: "แก้ไข",
          cancel: "ยกเลิก",
          save: "บันทึกการตั้งค่าผู้ใช้"
        },
        role: {
          title: "การตั้งค่าบทบาท",
          current: "บทบาทปัจจุบัน",
          select: "เลือกบทบาท",
          admin: "ผู้ดูแลระบบ",
          user: "ผู้ใช้",
          moderator: "ผู้ดูแล",
          guest: "แขก",
          edit: "แก้ไข",
          cancel: "ยกเลิก",
          save: "บันทึกการตั้งค่าบทบาท"
        },
        theme: {
          title: "การตั้งค่าธีม",
          light: "ธีมสว่าง",
          dark: "ธีมมืด",
          auto: "อัตโนมัติ (ระบบ)",
          apply: "ใช้ธีม"
        },
        language: {
          title: "การตั้งค่าภาษา",
          select: "เลือกภาษา",
          save: "บันทึกภาษา"
        },
        success: {
          title: "บันทึกสำเร็จ",
          message: "การตั้งค่าของคุณได้ถูกบันทึกเรียบร้อยแล้ว!"
        },
        error: {
          title: "เกิดข้อผิดพลาดในการบันทึก",
          message: "ไม่สามารถบันทึกการตั้งค่าได้ กรุณาลองอีกครั้ง"
        }
      }
    }
  },

  en: {
    translation: {
      navbar: {
        welcome: "Welcome - KB",
        home: "Home",
        dashboard: "Dashboard",
        article: "Article", 
        profile: "Profile",
        settings: "Settings",
        logout: "Logout"
      },
      settings: {
        title: "Settings",
        subtitle: "Manage your account settings and preferences",
        user: {
          title: "User Settings",
          username: "Username",
          email: "Email",
          firstName: "First Name",
          lastName: "Last Name",
          edit: "Edit",
          cancel: "Cancel",
          save: "Save User Settings"
        },
        role: {
          title: "Role Settings",
          current: "Current Role",
          select: "Select Role",
          admin: "Administrator",
          user: "User",
          moderator: "Moderator",
          guest: "Guest",
          edit: "Edit",
          cancel: "Cancel",
          save: "Save Role Settings"
        },
        theme: {
          title: "Theme Settings",
          light: "Light Theme",
          dark: "Dark Theme",
          auto: "Auto (System)",
          apply: "Apply Theme"
        },
        language: {
          title: "Language Settings",
          select: "Select Language",
          save: "Save Language"
        },
        success: {
          title: "Settings Saved",
          message: "Your settings have been saved successfully!"
        },
        error: {
          title: "Save Error",
          message: "Failed to save settings. Please try again."
        }
        }

    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'th',
    fallbackLng: 'th',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;