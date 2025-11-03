import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  i18n,
  initializeLanguage,
  changeLanguage,
  getCurrentLanguage,
  getLanguageInfo,
  availableLanguages,
  t as translate,
  formatNumber,
  formatDate,
  formatRelativeTime,
  getTextDirection
} from '../locales';

export const useTranslation = () => {
  const [language, setLanguage] = useState(getCurrentLanguage());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language on mount
  useEffect(() => {
    const init = async () => {
      try {
        const initializedLanguage = await initializeLanguage();
        setLanguage(initializedLanguage);
      } catch (error) {
        console.error('Error initializing translation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Change language function
  const changeAppLanguage = async (languageCode) => {
    try {
      const success = await changeLanguage(languageCode);
      if (success) {
        setLanguage(languageCode);
      }
      return success;
    } catch (error) {
      console.error('Error changing language:', error);
      return false;
    }
  };

  // Get current language info
  const currentLanguageInfo = getLanguageInfo(language);

  // Get text direction
  const textDirection = getTextDirection();

  // Return all translation utilities
  return {
    // Current state
    currentLanguage: language,
    currentLanguageInfo,
    isLoading,
    textDirection,
    isRTL: textDirection === 'rtl',

    // Available languages
    availableLanguages,

    // Core translation function
    t: translate,

    // Language management
    changeLanguage: changeAppLanguage,

    // Formatting utilities
    formatNumber,
    formatDate,
    formatRelativeTime,

    // Direct access to i18n instance for advanced usage
    i18n,
  };
};

export default useTranslation;