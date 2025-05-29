"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../component/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faUserTag,
  faPalette,
  faLanguage,
  faSave,
  faEdit,
  faSun,
  faMoon
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import '../../../lib/i18n'; 

export default function Setting() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  // Check if user is logged in
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      router.push('/pages/login');
    }
  }, [router]);

  // State for user settings
  const [userSettings, setUserSettings] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    theme: 'light',
    language: 'th'
  });

  const [isEditing, setIsEditing] = useState({
    user: false,
    role: false,
    theme: false,
    language: false
  });

  // Load data from localStorage when component mounts
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    const userRole = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    const savedLanguage = localStorage.getItem('language') || 'th';
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Set language in i18n
     if (i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.className = savedTheme === 'dark' ? 'dark-theme' : 'light-theme';
    
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        setUserSettings(prev => ({
          ...prev,
          username: username || '',
          email: parsedUserData.email || '',
          firstName: parsedUserData.firstName || '',
          lastName: parsedUserData.lastName || '',
          role: userRole || '',
          theme: savedTheme,
          language: savedLanguage
        }));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [i18n]);

    useEffect(() => {
    const handleLanguageChanged = () => {
      const currentLang = localStorage.getItem('language') || 'th';
      if (userSettings.language !== currentLang) {
        setUserSettings(prev => ({
          ...prev,
          language: currentLang
        }));
      }
    };

    // Listen for storage changes (if language changed in another tab/component)
    window.addEventListener('storage', handleLanguageChanged);
    
    // Custom event listener for language changes within the same page
    window.addEventListener('languageChanged', handleLanguageChanged);

    return () => {
      window.removeEventListener('storage', handleLanguageChanged);
      window.removeEventListener('languageChanged', handleLanguageChanged);
    };
  }, [userSettings.language]);

const handleInputChange = async (field, value) => {
    setUserSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Change language immediately when new language is selected
    if (field === 'language') {
      try {
        // เปลี่ยนภาษาใน i18n instance
        await i18n.changeLanguage(value);
        
        // บันทึกใน localStorage
        localStorage.setItem('language', value);
        
        // Dispatch custom event เพื่อแจ้ง components อื่นๆ ให้อัพเดท
        window.dispatchEvent(new CustomEvent('languageChanged', {
          detail: { language: value }
        }));
        
        // แสดงข้อความสำเร็จ
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `Language changed to ${value === 'th' ? 'Thai' : value === 'en' ? 'English' : value === 'zh' ? 'Chinese' : value === 'ja' ? 'Japanese' : 'Korean'}`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
        
      } catch (error) {
        console.error('Error changing language:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to change language. Please try again.',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  // Function to toggle theme
  const toggleTheme = () => {
    const newTheme = userSettings.theme === 'light' ? 'dark' : 'light';
    setUserSettings(prev => ({
      ...prev,
      theme: newTheme
    }));
    
    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.className = newTheme === 'dark' ? 'dark-theme' : 'light-theme';
    localStorage.setItem('theme', newTheme);
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: t('settings.success.title'),
      text: t('setting theme changed'),
      timer: 1500,
      timerProgressBar: true,
      showConfirmButton: false
    });
  };

  // Function to save settings
  const handleSave = async (section) => {
    try {
      // Save to localStorage
      if (section === 'user') {
        const updatedUserData = {
          email: userSettings.email,
          firstName: userSettings.firstName,
          lastName: userSettings.lastName
        };
        localStorage.setItem('user_data', JSON.stringify(updatedUserData));
        localStorage.setItem('username', userSettings.username);
      }
      
      if (section === 'role') {
        localStorage.setItem('user_role', userSettings.role);
      }
      
      if (section === 'language') {
        localStorage.setItem('language', userSettings.language);
      }

      setIsEditing(prev => ({
        ...prev,
        [section]: false
      }));

      await Swal.fire({
        icon: 'success',
        title: t('settings.success.title'),
        text: t('settings success message'),
        timer: 2000,
        timerProgressBar: true
      });

    } catch (error) {
      console.error('Error saving settings:', error);
      await Swal.fire({
        icon: 'error',
        title: t('settings.error.title'),
        text: t('settings error message'),
        confirmButtonText: 'OK'
      });
    }
  };

  // Dynamic styles based on theme
  const getThemeStyles = () => {
    const isDark = userSettings.theme === 'dark';
    return {
      body: {
        minHeight: '100vh',
        backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
        color: isDark ? '#ffffff' : '#333333',
        transition: 'all 0.3s ease'
      },
      container: {
        marginLeft: '250px',
        padding: '2rem',
        maxWidth: '1200px'
      },
      card: {
        background: isDark ? '#2d2d2d' : 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
        transition: 'all 0.3s ease'
      },
      input: {
        padding: '0.75rem',
        border: isDark ? '2px solid #404040' : '2px solid #e0e0e0',
        borderRadius: '6px',
        fontSize: '1rem',
        backgroundColor: isDark ? '#3d3d3d' : 'white',
        color: isDark ? '#ffffff' : '#333333',
        transition: 'all 0.3s ease'
      },
      inputDisabled: {
        backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8',
        color: isDark ? '#888888' : '#666666'
      },
      toggleButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.5rem',
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        backgroundColor: isDark ? '#4a90e2' : '#f0f0f0',
        color: isDark ? 'white' : '#333333',
        boxShadow: isDark ? '0 4px 12px rgba(74, 144, 226, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
      }
    };
  };

  const styles = getThemeStyles();

  return (
    <div style={styles.body}>
      <Navbar />
      
      <div style={styles.container}>
        <div style={{marginBottom: '2rem', paddingBottom: '1rem', borderBottom: `2px solid ${userSettings.theme === 'dark' ? '#404040' : '#e0e0e0'}`}}>
          <h1 style={{fontSize: '2.5rem', color: userSettings.theme === 'dark' ? '#ffffff' : '#333', marginBottom: '0.5rem', fontWeight: '600'}}>{t('settings.title')}</h1>
          <p style={{color: userSettings.theme === 'dark' ? '#cccccc' : '#666666'}}>{t('settings.subtitle')}</p>
        </div>

        {/* User Settings Section */}
        <div style={styles.card}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${userSettings.theme === 'dark' ? '#404040' : '#f0f0f0'}`}}>
            <FontAwesomeIcon icon={faUser} style={{fontSize: '1.5rem', color: '#4a90e2', marginRight: '0.75rem'}} />
            <h2 style={{fontSize: '1.5rem', color: userSettings.theme === 'dark' ? '#ffffff' : '#333', margin: 0, flexGrow: 1, fontWeight: '500'}}>{t('settings.user.title')}</h2>
            <button 
              style={{background: '#4a90e2', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}
              onClick={() => setIsEditing(prev => ({ ...prev, user: !prev.user }))}
            >
              <FontAwesomeIcon icon={faEdit} />
              {isEditing.user ? t('settings.user.cancel') : t('settings.user.edit')}
            </button>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontWeight: '500', color: userSettings.theme === 'dark' ? '#ffffff' : '#333', fontSize: '0.9rem'}}>{t('settings.user.username')}</label>
              <input
                type="text"
                value={userSettings.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={!isEditing.user}
                style={{...styles.input, ...(isEditing.user ? {} : styles.inputDisabled)}}
              />
            </div>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontWeight: '500', color: userSettings.theme === 'dark' ? '#ffffff' : '#333', fontSize: '0.9rem'}}>{t('settings.user.email')}</label>
              <input
                type="email"
                value={userSettings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing.user}
                style={{...styles.input, ...(isEditing.user ? {} : styles.inputDisabled)}}
              />
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                <label style={{fontWeight: '500', color: userSettings.theme === 'dark' ? '#ffffff' : '#333', fontSize: '0.9rem'}}>{t('settings.user.firstName')}</label>
                <input
                  type="text"
                  value={userSettings.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing.user}
                  style={{...styles.input, ...(isEditing.user ? {} : styles.inputDisabled)}}
                />
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                <label style={{fontWeight: '500', color: userSettings.theme === 'dark' ? '#ffffff' : '#333', fontSize: '0.9rem'}}>{t('settings.user.lastName')}</label>
                <input
                  type="text"
                  value={userSettings.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing.user}
                  style={{...styles.input, ...(isEditing.user ? {} : styles.inputDisabled)}}
                />
              </div>
            </div>
            
            {isEditing.user && (
              <button 
                style={{alignSelf: 'flex-start', background: '#28a745', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem'}}
                onClick={() => handleSave('user')}
              >
                <FontAwesomeIcon icon={faSave} />
                {t('settings.user.save')}
              </button>
            )}
          </div>
        </div>

        {/* Role Settings Section */}
        <div style={styles.card}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${userSettings.theme === 'dark' ? '#404040' : '#f0f0f0'}`}}>
            <FontAwesomeIcon icon={faUserTag} style={{fontSize: '1.5rem', color: '#4a90e2', marginRight: '0.75rem'}} />
            <h2 style={{fontSize: '1.5rem', color: userSettings.theme === 'dark' ? '#ffffff' : '#333', margin: 0, flexGrow: 1, fontWeight: '500'}}>{t('settings.role.title')}</h2>
            <button 
              style={{background: '#4a90e2', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}
              onClick={() => setIsEditing(prev => ({ ...prev, role: !prev.role }))}
            >
              <FontAwesomeIcon icon={faEdit} />
              {isEditing.role ? t('settings.role.cancel') : t('settings.role.edit')}
            </button>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontWeight: '500', color: userSettings.theme === 'dark' ? '#ffffff' : '#333', fontSize: '0.9rem'}}>{t('settings.role.current')}</label>
              <select
                value={userSettings.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                disabled={!isEditing.role}
                style={{...styles.input, ...(isEditing.role ? {} : styles.inputDisabled)}}
              >
                <option value="">{t('settings.role.select')}</option>
                <option value="admin">{t('settings.role.admin')}</option>
                <option value="user">{t('settings.role.user')}</option>
                <option value="moderator">{t('settings.role.moderator')}</option>
                <option value="guest">{t('settings.role.guest')}</option>
              </select>
            </div>
            
            {isEditing.role && (
              <button 
                style={{alignSelf: 'flex-start', background: '#28a745', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem'}}
                onClick={() => handleSave('role')}
              >
                <FontAwesomeIcon icon={faSave} />
                {t('settings.role.save')}
              </button>
            )}
          </div>
        </div>

         {/* Theme Settings Section */}
        <div style={styles.card}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${userSettings.theme === 'dark' ? '#404040' : '#f0f0f0'}`}}>
            <FontAwesomeIcon icon={faPalette} style={{fontSize: '1.5rem', color: '#4a90e2', marginRight: '0.75rem'}} />
            <h2 style={{fontSize: '1.5rem', color: userSettings.theme === 'dark' ? '#ffffff' : '#333', margin: 0, flexGrow: 1, fontWeight: '500'}}>{t('settings.theme.title')}</h2>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FontAwesomeIcon 
                  icon={userSettings.theme === 'dark' ? faMoon : faSun} 
                  style={{
                    fontSize: '1.2rem', 
                    color: userSettings.theme === 'dark' ? '#4a90e2' : '#FFA500',
                    transition: 'color 0.3s ease'
                  }} 
                />
                <span style={{fontSize: '1rem', fontWeight: '500', color: userSettings.theme === 'dark' ? '#ffffff' : '#333'}}>
                  {userSettings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              
              {/* Toggle Switch */}
              <div 
                onClick={toggleTheme}
                style={{
                  width: '60px',
                  height: '30px',
                  borderRadius: '15px',
                  backgroundColor: userSettings.theme === 'dark' ? '#4a90e2' : '#ccc',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: userSettings.theme === 'dark' ? '32px' : '2px',
                    transition: 'left 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FontAwesomeIcon 
                    icon={userSettings.theme === 'dark' ? faMoon : faSun} 
                    style={{
                      fontSize: '0.8rem', 
                      color: userSettings.theme === 'dark' ? '#4a90e2' : '#FFA500'
                    }} 
                  />
                </div>
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: userSettings.theme === 'dark' ? '#3d3d3d' : '#f8f9fa',
              border: `1px solid ${userSettings.theme === 'dark' ? '#404040' : '#e9ecef'}`
            }}>
              <p style={{
                margin: 0,
                fontSize: '0.9rem',
                color: userSettings.theme === 'dark' ? '#cccccc' : '#666666',
                textAlign: 'center'
              }}>
                {userSettings.theme === 'dark' 
                  ? '🌙 Dark mode is active - easier on your eyes in low light'
                  : '☀️ Light mode is active - perfect for daytime use'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Language Settings Section */}
        <div style={styles.card}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${userSettings.theme === 'dark' ? '#404040' : '#f0f0f0'}`}}>
            <FontAwesomeIcon icon={faLanguage} style={{fontSize: '1.5rem', color: '#4a90e2', marginRight: '0.75rem'}} />
            <h2 style={{fontSize: '1.5rem', color: userSettings.theme === 'dark' ? '#ffffff' : '#333', margin: 0, flexGrow: 1, fontWeight: '500'}}>{t('settings.language.title')}</h2>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontWeight: '500', color: userSettings.theme === 'dark' ? '#ffffff' : '#333', fontSize: '0.9rem'}}>{t('settings.language.select')}</label>
              <select
                value={userSettings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                style={styles.input}
              >
                <option value="th">ไทย</option>
                <option value="en">English</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="ko">한국어 (Korean)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}