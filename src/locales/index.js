import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Localization } from 'expo-localization';

// Import translations
import en from './en.json';
import kn from './kn.json';
import hi from './hi.json';

// Create i18n instance
const i18n = new I18n({
  en,
  kn,
  hi,
});

// Set default locale
i18n.defaultLocale = 'en';
i18n.locale = Localization.locale || 'en';
i18n.fallbacks = true;

// Available languages
export const availableLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

// Language storage key
const LANGUAGE_STORAGE_KEY = 'janmitra_language';

// Initialize language from storage
export const initializeLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && availableLanguages.find(lang => lang.code === savedLanguage)) {
      i18n.locale = savedLanguage;
      return savedLanguage;
    }

    // If no saved language, use device locale
    const deviceLanguage = Localization.locale?.split('-')[0];
    const supportedLanguage = availableLanguages.find(lang => lang.code === deviceLanguage);

    if (supportedLanguage) {
      i18n.locale = supportedLanguage.code;
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, supportedLanguage.code);
      return supportedLanguage.code;
    }

    // Default to English
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    return 'en';
  } catch (error) {
    console.error('Error initializing language:', error);
    return 'en';
  }
};

// Change language and persist to storage
export const changeLanguage = async (languageCode) => {
  try {
    if (availableLanguages.find(lang => lang.code === languageCode)) {
      i18n.locale = languageCode;
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

// Get current language
export const getCurrentLanguage = () => i18n.locale;

// Get language info
export const getLanguageInfo = (languageCode) => {
  return availableLanguages.find(lang => lang.code === languageCode) || availableLanguages[0];
};

// Translate function
export const t = (key, options = {}) => i18n.t(key, options);

// Format numbers based on locale
export const formatNumber = (number) => {
  try {
    return new Intl.NumberFormat(i18n.locale).format(number);
  } catch (error) {
    console.error('Error formatting number:', error);
    return number.toString();
  }
};

// Format dates based on locale
export const formatDate = (date, options = {}) => {
  try {
    const dateObj = new Date(date);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };
    return new Intl.DateTimeFormat(i18n.locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toString();
  }
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  try {
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = now - targetDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });

    return formatDate(targetDate);
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return formatDate(date);
  }
};

// Get text direction for RTL languages
export const getTextDirection = () => {
  const rtlLanguages = ['ar', 'he', 'fa'];
  return rtlLanguages.includes(i18n.locale) ? 'rtl' : 'ltr';
};

export default i18n;