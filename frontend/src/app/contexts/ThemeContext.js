"use client";

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 🎨 Design Tokens - เฉพาะสีและค่าพื้นฐาน
const THEME_TOKENS = {
  light: {
    // Background & Surface
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceAlt: '#f8f9fa',
    surfaceDisabled: '#f8f8f8',
    
    // Borders
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    borderStrong: '#d1d5db',
    
    // Text Colors
    text: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    textDisabled: '#666666',
    
    // Status Colors
    primary: '#007bff',
    primaryHover: '#0056b3',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    
    // Shadows
     shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    shadowLight: '0 1px 4px rgba(0, 0, 0, 0.08)',
    shadowMedium: '0 4px 12px rgba(0, 0, 0, 0.12)',
    shadowStrong: '0 10px 25px rgba(0, 0, 0, 0.15)'
  },
  dark: {
    // Background & Surface
    background: '#1a1a1a',
    surface: '#2d2d2d',
    surfaceAlt: '#3d3d3d',
    surfaceDisabled: '#2a2a2a',
    
    // Borders
    border: '#404040',
    borderLight: '#555555',
    borderStrong: '#4a5568',
    
    // Text Colors
    text: '#ffffff',
    textSecondary: '#cccccc',
    textMuted: '#888888',
    textDisabled: '#888888',
    
    // Status Colors
    primary: '#4a90e2',
    primaryHover: '#357abd',
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    
    // Shadows
   shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    shadowLight: '0 1px 4px rgba(0, 0, 0, 0.2)',
    shadowMedium: '0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowStrong: '0 10px 25px rgba(0, 0, 0, 0.5)'
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      const newTheme = localStorage.getItem('theme') || 'light';
      setTheme(newTheme);
      applyTheme(newTheme);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  // ✅ Apply theme using CSS custom properties
  const applyTheme = (themeName) => {
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Set CSS custom properties for use in CSS files
    const tokens = THEME_TOKENS[themeName];
    Object.entries(tokens).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--theme-${key}`, value);
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);

    window.dispatchEvent(
      new CustomEvent('themeChanged', {
        detail: { theme: newTheme },
      })
    );
  };

  // 🎯 Minimal dynamic styles - เฉพาะที่จำเป็นจริงๆ
  const getThemeStyles = () => {
    const tokens = THEME_TOKENS[theme];
    
    return {
      // Global body style
      body: {
        backgroundColor: tokens.background,
        color: tokens.text,
        transition: 'background-color 0.3s ease, color 0.3s ease'
      },

      // Dynamic styles for JS-controlled elements
      dynamicCard: {
        backgroundColor: tokens.surface,
        borderColor: tokens.border,
        boxShadow: tokens.shadow,
        color: tokens.text
      },

      dynamicInput: {
        backgroundColor: tokens.surface,
        borderColor: tokens.border,
        color: tokens.text
      },

      dynamicButton: {
        backgroundColor: tokens.primary,
        color: tokens.text === '#ffffff' ? '#ffffff' : tokens.surface
      },

      // Hover states (for JS hover handlers)
      hoverRow: {
        backgroundColor: tokens.surfaceAlt
      },

      // Status colors for badges/alerts
      statusSuccess: {
        backgroundColor: tokens.success,
        color: '#ffffff'
      },

      statusError: {
        backgroundColor: tokens.error,
        color: '#ffffff'
      },

      statusWarning: {
        backgroundColor: tokens.warning,
        color: tokens.text
      }
    };
  };

  // 🎯 Simple helper for common theme-aware styles
  const getComponentStyle = (component) => {
    const tokens = THEME_TOKENS[theme];
    
    switch (component) {
      case 'modal':
        return {
          backgroundColor: tokens.surface,
          borderColor: tokens.border,
          boxShadow: tokens.shadowStrong
        };
      
      case 'table-stripe':
        return (index) => ({
          backgroundColor: index % 2 === 0 ? tokens.surface : tokens.surfaceAlt
        });
      
      case 'disabled':
        return {
          backgroundColor: tokens.surfaceDisabled,
          color: tokens.textDisabled,
          cursor: 'not-allowed'
        };
        
      default:
        return {};
    }
  };

  const value = {
    theme,
    toggleTheme,
    getThemeStyles,
    getComponentStyle,
    isDark: theme === 'dark',
    tokens: THEME_TOKENS[theme] // Direct access to tokens
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};