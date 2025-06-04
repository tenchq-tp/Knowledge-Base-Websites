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
      profile: {
        loading: "กำลังโหลดข้อมูลโปรไฟล์...",
        myProfile: "ข้อมูลโปรไฟล์ของฉัน",
        editmyProfile: "เเก้ไขโปรไฟล์ของฉัน",
        title: "คำนำหน้า",
        selectTitle: "เลือกคำนำหน้า",
        fullName: "ชื่อเต็ม",
        displayName: "ชื่อที่ใช้แสดง",
        firstName: "ชื่อ",
        lastName: "นามสกุล",
        phone: "เบอร์โทรศัพท์",
        dateOfBirth: "วันเกิด",
        gender: "เพศ",
        selectGender: "เลือกเพศ",
        male: "ชาย",
        female: "หญิง",
        other: "อื่นๆ",
        country: "ประเทศ",
        city: "เมือง",
        address: "ที่อยู่",
        edit: "แก้ไข",
        save: "บันทึก",
        saveSuccess:"บันทึกสำเร็จ"
        
        
      },
      actions: {
        createArticle: "สร้างบทความ",
        read: "อ่าน",
        edit: "แก้ไข",
        delete: "ลบ",
        backtoearth: "กลับสู่โลก"
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
          apply: "ใช้ธีม",
          changed: "เปลี่ยนธีมเรียบร้อยแล้ว",
          lightMode: "โหมดสว่าง",
          darkMode: "โหมดมืด",
          switchedToLight: "เปลี่ยนเป็นโหมดสว่างแล้ว",
          switchedToDark: "เปลี่ยนเป็นโหมดมืดแล้ว"
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
        errorUpdate: "ไม่สามารถอัปเดตหมวดหมู่ได้",
        selectColorTitle: "เลือกสี",
        selectIconTitle: "เลือกไอคอน"

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
      profile: {
        saveSuccess:"Save Success",
        editmyProfile: "Edit My Profile",
        loading: "Loading profile...",
        myProfile: "My Profile",
        title: "Title",
        selectTitle: "Select Title",
        fullName: "Full Name",
        displayName: "Display Name",
        firstName: "First Name",
        lastName: "Last Name",
        phone: "Phone",
        dateOfBirth: "Date of Birth",
        gender: "Gender",
        selectGender: "Select Gender",
        male: "Male",
        female: "Female",
        other: "Other",
        country: "Country",
        city: "City",
        address: "Address",
        edit: "Edit",
        save: "Save"
      },
      
      actions: {
        createArticle: "Create Article",
        read: "Read",
        edit: "Edit",
        delete: "Delete",
        backtoearth: "Back to Earth"
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
          apply: "Apply Theme",
          changed: "Theme changed successfully",
          lightMode: "Light Mode",
          darkMode: "Dark Mode",
          switchedToLight: "Switched to Light Mode",
          switchedToDark: "Switched to Dark Mode"
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
  },

  zh: {
    translation: {
      navbar: {
        welcome: "欢迎 - KB",
        home: "首页",
        dashboard: "仪表盘",
        article: "文章",
        profile: "个人资料",
        settings: "设置",
        logout: "登出"
      },
      settings: {
        title: "设置",
        subtitle: "管理您的账户设置和偏好",
        user: {
          title: "用户设置",
          username: "用户名",
          email: "邮箱",
          firstName: "名",
          lastName: "姓",
          edit: "编辑",
          cancel: "取消",
          save: "保存用户设置"
        },
        role: {
          title: "角色设置",
          current: "当前角色",
          select: "选择角色",
          admin: "管理员",
          user: "用户",
          moderator: "版主",
          guest: "访客",
          edit: "编辑",
          cancel: "取消",
          save: "保存角色设置"
        },
        theme: {
          title: "主题设置",
          light: "浅色主题",
          dark: "深色主题",
          auto: "自动（系统）",
          apply: "应用主题",
          changed: "主题更改成功",
          lightMode: "浅色模式",
          darkMode: "深色模式",
          switchedToLight: "已切换到浅色模式",
          switchedToDark: "已切换到深色模式"
        },
        language: {
          title: "语言设置",
          select: "选择语言",
          save: "保存语言"
        },
        success: {
          title: "保存成功",
          message: "您的设置已成功保存！"
        },
        error: {
          title: "保存错误",
          message: "保存设置失败，请重试。"
        }
      }
    }
  },

  ja: {
    translation: {
      navbar: {
        welcome: "ようこそ - KB",
        home: "ホーム",
        dashboard: "ダッシュボード",
        article: "記事",
        profile: "プロフィール",
        settings: "設定",
        logout: "ログアウト"
      },
      settings: {
        title: "設定",
        subtitle: "アカウント設定と環境設定を管理",
        user: {
          title: "ユーザー設定",
          username: "ユーザー名",
          email: "メール",
          firstName: "名",
          lastName: "姓",
          edit: "編集",
          cancel: "キャンセル",
          save: "ユーザー設定を保存"
        },
        role: {
          title: "役割設定",
          current: "現在の役割",
          select: "役割を選択",
          admin: "管理者",
          user: "ユーザー",
          moderator: "モデレーター",
          guest: "ゲスト",
          edit: "編集",
          cancel: "キャンセル",
          save: "役割設定を保存"
        },
        theme: {
          title: "テーマ設定",
          light: "ライトテーマ",
          dark: "ダークテーマ",
          auto: "自動（システム）",
          apply: "テーマを適用",
          changed: "テーマを変更しました",
          lightMode: "ライトモード",
          darkMode: "ダークモード",
          switchedToLight: "ライトモードに切り替えました",
          switchedToDark: "ダークモードに切り替えました"
        },
        language: {
          title: "言語設定",
          select: "言語を選択",
          save: "言語を保存"
        },
        success: {
          title: "保存成功",
          message: "設定が正常に保存されました！"
        },
        error: {
          title: "保存エラー",
          message: "設定の保存に失敗しました。再試行してください。"
        }
      }
    }
  },

  ko: {
    translation: {
      navbar: {
        welcome: "환영합니다 - KB",
        home: "홈",
        dashboard: "대시보드",
        article: "기사",
        profile: "프로필",
        settings: "설정",
        logout: "로그아웃"
      },
      settings: {
        title: "설정",
        subtitle: "계정 설정 및 환경 설정 관리",
        user: {
          title: "사용자 설정",
          username: "사용자명",
          email: "이메일",
          firstName: "이름",
          lastName: "성",
          edit: "편집",
          cancel: "취소",
          save: "사용자 설정 저장"
        },
        role: {
          title: "역할 설정",
          current: "현재 역할",
          select: "역할 선택",
          admin: "관리자",
          user: "사용자",
          moderator: "모더레이터",
          guest: "게스트",
          edit: "편집",
          cancel: "취소",
          save: "역할 설정 저장"
        },
        theme: {
          title: "테마 설정",
          light: "라이트 테마",
          dark: "다크 테마",
          auto: "자동 (시스템)",
          apply: "테마 적용",
          changed: "테마가 변경되었습니다",
          lightMode: "라이트 모드",
          darkMode: "다크 모드",
          switchedToLight: "라이트 모드로 전환했습니다",
          switchedToDark: "다크 모드로 전환했습니다"
        },
        language: {
          title: "언어 설정",
          select: "언어 선택",
          save: "언어 저장"
        },
        success: {
          title: "저장 성공",
          message: "설정이 성공적으로 저장되었습니다!"
        },
        error: {
          title: "저장 오류",
          message: "설정 저장에 실패했습니다. 다시 시도해주세요."
        }
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
