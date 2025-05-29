import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  th: {
    translation: {
      navbar: {
        welcome: "Welcome - KB",
        home: "หน้าแรก",
        dashboard: "แดชบอร์ด",
        category: "หมวดหมู่",
        profile: "โปรไฟล์",
        settings: "การตั้งค่า",
        logout: "ออกจากระบบ"
      },
      actions: {
        createArticle: "สร้างบทความ",
        read: "อ่าน",
        edit: "แก้ไข",
        delete: "ลบ"
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
      },
      logout: {
        confirm_title: "ยืนยันการออกจากระบบ",
        confirm_text: "คุณแน่ใจหรือว่าต้องการออกจากระบบ?",
        yes_logout: "ใช่, ออกจากระบบ",
        cancel: "ยกเลิก",
        success_title: "ออกจากระบบเรียบร้อยแล้ว",
        warning_title: "แจ้งเตือนการออกจากระบบ",
        warning_text: "การออกจากระบบบนเซิร์ฟเวอร์ล้มเหลว แต่คุณถูกออกจากระบบในเครื่องแล้ว",
        error_title: "เกิดข้อผิดพลาด",
        error_text: "ไม่สามารถออกจากระบบได้ กรุณาลองใหม่ภายหลัง",
      },
    
      categoryModal: {
        deleteSuccessTitle: "ลบสำเร็จ",
        deleteSuccessText: "หมวดหมู่ถูกลบออกจากระบบเรียบร้อยแล้ว",
        deleteConfirmTitle: "ยืนยันการลบ",
        deleteConfirmText: "คุณแน่ใจว่าต้องการลบหมวดหมู่นี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้",
        confirmYes: "ใช่",
        confirmNo: "ไม่ใช่",
        createTitle: "สร้างหมวดหมู่",
        editTitle: "แก้ไขหมวดหมู่",
        nameLabel: "ชื่อหมวดหมู่ *",
        descriptionLabel: "คำอธิบาย (ไม่บังคับ)",
        nameLabelinput: "กรอกชื่อหมวดหมู่...", 
        descriptionLabelinput: "กรอกคำอธิบาย...",  
        searchPlaceholder: "ค้นหาไอคอน...",
        createBtn: "สร้าง",
        updateBtn: "อัปเดต",
        cancelBtn: "ยกเลิก",
        successTitle: "สำเร็จ!",
        successCreate: "สร้างหมวดหมู่เรียบร้อยแล้ว",
        successUpdate: "อัปเดตหมวดหมู่เรียบร้อยแล้ว",
        errorTitle: "ล้มเหลว!",
        errorCreate: "ไม่สามารถสร้างหมวดหมู่ได้",
        errorUpdate: "ไม่สามารถอัปเดตหมวดหมู่ได้"
      }
    }
  },

  en: {
    translation: {
      navbar: {
        welcome: "Welcome - KB",
        home: "Home",
        dashboard: "Dashboard",
        category: "Category",
        profile: "Profile",
        settings: "Settings",
        logout: "Logout"
      },
      actions: {
        createArticle: "Create Article",
        read: "Read",
        edit: "Edit",
        delete: "Delete"
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
      },
      logout: {
        confirm_title: "Confirm Logout",
        confirm_text: "Are you sure you want to log out?",
        yes_logout: "Yes, Logout",
        cancel: "Cancel",
        success_title: "Logged Out",
        warning_title: "Logout Warning",
        warning_text: "Logout failed on server, but you are logged out locally.",
        error_title: "Error",
        error_text: "Unable to logout. Please try again later.",
      },
      categoryModal: {
        deleteSuccessTitle: "Deleted Successfully",
        deleteSuccessText: "The category has been successfully removed",
        createTitle: "Create Category",
        deleteConfirmTitle: "Confirm Deletion",
        deleteConfirmText: "Are you sure you want to delete this category? This action cannot be undone.",
        confirmYes: "Yes",
        confirmNo: "No",
        editTitle: "Edit Category",
        nameLabel: "Category Name *",
        descriptionLabel: "Description (optional)",
        nameLabelinput: "Enter category name...",  
        descriptionLabelinput: "Enter short description...", 
        searchPlaceholder: "Search icon...",
        
        createBtn: "Create",
        updateBtn: "Update",
        cancelBtn: "Cancel",
        successTitle: "Success!",
        successCreate: "Category created successfully",
        successUpdate: "Category updated successfully",
        errorTitle: "Failed!",
        errorCreate: "Failed to create category",
        errorUpdate: "Failed to update category"
      }
      
    }
    
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'th', // default language
    fallbackLng: 'th',
    interpolation: {
      escapeValue: false // react already escapes values
    }
  });

export default i18n;
