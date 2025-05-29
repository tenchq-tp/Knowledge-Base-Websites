'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useEffect } from 'react';

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // โหลดภาษาที่บันทึกไว้จาก localStorage
    const savedLanguage = localStorage.getItem('language') || 'th';
    i18n.changeLanguage(savedLanguage);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}