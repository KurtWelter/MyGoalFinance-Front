// i18n/index.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { type InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

// Normaliza: 'ES' -> 'es', 'es-CL' -> 'es'
const normalize = (lng?: string) =>
  (lng || 'es').toString().trim().toLowerCase().split(/[-_]/)[0] as 'es' | 'en';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const saved = await AsyncStorage.getItem('user-language');
      callback(normalize(saved || 'es'));
    } catch {
      callback('es');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', normalize(lng));
    } catch (error) {
      console.error('Error saving language to AsyncStorage:', error);
    }
  },
};

// Opciones tipadas (sin compatibilityJSON para evitar el error)
const options: InitOptions = {
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  fallbackLng: 'es',
  supportedLngs: ['en', 'es'],
  // Si recibes 'es-CL', i18next lo plegará a 'es'
  nonExplicitSupportedLngs: true,
  debug: false,
  interpolation: { escapeValue: false },
  returnNull: false,
};

i18n
  .use(LANGUAGE_DETECTOR as any)
  .use(initReactI18next)
  .init(options);

// Helper para tu LanguageSelector
export async function setAppLanguage(lng: string) {
  const n = normalize(lng);
  await i18n.changeLanguage(n);
  await AsyncStorage.setItem('user-language', n);
}

export default i18n;
