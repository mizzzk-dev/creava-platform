import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import jaCommon from '@/locales/ja/common.json'
import enCommon from '@/locales/en/common.json'
import koCommon from '@/locales/ko/common.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: {
        common: jaCommon,
      },
      en: {
        common: enCommon,
      },
      ko: {
        common: koCommon,
      },
    },
    fallbackLng: 'ja',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'querystring', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'mizzz_lang',
      caches: ['localStorage'],
    },
  })

export default i18n
