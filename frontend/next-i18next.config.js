module.exports = {
  i18n: {
    defaultLocale: 'th',
    locales: ['th', 'en'],
  },
  fallbackLng: 'th',
  debug: false,
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  saveMissing: true,
  keySeparator: '.',
  interpolation: {
    escapeValue: false,
  },
};