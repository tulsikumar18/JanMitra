import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache for translations to avoid repeated API calls
const translationCache = new Map();

// Google Translate API would normally require API keys, but for this demo
// we'll use a mock implementation with some common translations
const mockTranslations = {
  // English to Kannada translations
  'en-kn': {
    'Hello': 'ಹಲೋ',
    'Thank you': 'ಧನ್ಯವಾದಗಳು',
    'Your issue has been resolved': 'ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಪರಿಹರಿಸಲಾಗಿದೆ',
    'We are working on your issue': 'ನಾವು ನಿಮ್ಮ ಸಮಸ್ಯೆಯ ಮೇಲೆ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೇವೆ',
    'Please provide more information': 'ದಯವಿಟ್ಟು ಹೆಚ್ಚಿನ ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸಿ',
    'Issue reported successfully': 'ಸಮಸ್ಯೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ವರದಿ ಮಾಡಲಾಗಿದೆ',
    'Status updated': 'ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ',
    'New message received': 'ಹೊಸ ಸಂದೇಶ ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
    'Please check your issue': 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಿ',
    'Your feedback is important': 'ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆ ಮಹತ್ವದ್ದಾಗಿದೆ',
  },
  // English to Hindi translations
  'en-hi': {
    'Hello': 'नमस्ते',
    'Thank you': 'धन्यवाद',
    'Your issue has been resolved': 'आपकी समस्या का समाधान हो गया है',
    'We are working on your issue': 'हम आपकी समस्या पर काम कर रहे हैं',
    'Please provide more information': 'कृपया अधिक जानकारी प्रदान करें',
    'Issue reported successfully': 'समस्या सफलतापूर्वक रिपोर्ट की गई',
    'Status updated': 'स्थिति अपडेट की गई',
    'New message received': 'नया संदेश प्राप्त हुआ',
    'Please check your issue': 'कृपया अपनी समस्या जांचें',
    'Your feedback is important': 'आपकी प्रतिक्रिया महत्वपूर्ण है',
  },
  // Kannada to English translations
  'kn-en': {
    'ಹಲೋ': 'Hello',
    'ಧನ್ಯವಾದಗಳು': 'Thank you',
    'ನಮಸ್ಕಾರ': 'Hello',
    'ಸ್ವಾಗತ': 'Welcome',
  },
  // Hindi to English translations
  'hi-en': {
    'नमस्ते': 'Hello',
    'धन्यवाद': 'Thank you',
    'स्वागत': 'Welcome',
    'शुभ प्रभात': 'Good morning',
  },
};

class TranslationService {
  constructor() {
    this.cacheEnabled = true;
    this.maxCacheSize = 1000;
  }

  // Get cache key for translation
  getCacheKey(text, fromLang, toLang) {
    return `${fromLang}-${toLang}:${text}`;
  }

  // Check if translation is cached
  getCachedTranslation(text, fromLang, toLang) {
    if (!this.cacheEnabled) return null;

    const key = this.getCacheKey(text, fromLang, toLang);
    const cached = translationCache.get(key);

    if (!cached) return null;

    // Check if cache is expired (24 hours)
    if (Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) {
      translationCache.delete(key);
      return null;
    }

    return cached.translation;
  }

  // Cache translation
  cacheTranslation(text, fromLang, toLang, translation) {
    if (!this.cacheEnabled) return;

    // Limit cache size
    if (translationCache.size >= this.maxCacheSize) {
      // Remove oldest entries
      const entries = Array.from(translationCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, 100);
      toRemove.forEach(([key]) => translationCache.delete(key));
    }

    const key = this.getCacheKey(text, fromLang, toLang);
    translationCache.set(key, {
      translation,
      timestamp: Date.now(),
    });
  }

  // Detect language of text (simplified version)
  detectLanguage(text) {
    // This is a very basic language detection
    // In a real app, you'd use a proper language detection library

    if (!text || text.length === 0) return 'en';

    // Check for Kannada characters
    if (/[\u0C80-\u0CFF]/.test(text)) {
      return 'kn';
    }

    // Check for Hindi characters
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hi';
    }

    // Default to English
    return 'en';
  }

  // Translate text using mock translations
  async translateText(text, fromLang, toLang) {
    // If source and target languages are the same, return original text
    if (fromLang === toLang) {
      return text;
    }

    // Check cache first
    const cached = this.getCachedTranslation(text, fromLang, toLang);
    if (cached) {
      return cached;
    }

    try {
      // Use mock translations for demo
      const cacheKey = `${fromLang}-${toLang}`;
      const mockDict = mockTranslations[cacheKey];

      let translation = text;

      if (mockDict && mockDict[text]) {
        translation = mockDict[text];
      } else {
        // For demo purposes, if no translation found, return original text
        // In a real app, you'd call Google Translate API here
        console.log(`No translation found for "${text}" from ${fromLang} to ${toLang}`);
      }

      // Cache the translation
      this.cacheTranslation(text, fromLang, toLang, translation);

      return translation;

    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  // Auto-translate text (detect source language)
  async translateTextAuto(text, targetLang) {
    const detectedLang = this.detectLanguage(text);
    return await this.translateText(text, detectedLang, targetLang);
  }

  // Translate multiple texts
  async translateMultipleTexts(texts, fromLang, toLang) {
    const translations = await Promise.all(
      texts.map(text => this.translateText(text, fromLang, toLang))
    );
    return translations;
  }

  // Get user's preferred language from storage
  async getUserLanguage() {
    try {
      const language = await AsyncStorage.getItem('janmitra_language');
      return language || 'en';
    } catch (error) {
      console.error('Error getting user language:', error);
      return 'en';
    }
  }

  // Translate message to user's preferred language
  async translateForUser(message, senderLanguage = 'en') {
    const userLanguage = await this.getUserLanguage();

    if (senderLanguage === userLanguage) {
      return message;
    }

    return await this.translateText(message, senderLanguage, userLanguage);
  }

  // Common template messages that can be translated
  getTemplateMessage(templateKey, language = 'en') {
    const templates = {
      en: {
        issueReceived: 'We have received your report and are working on it.',
        issueResolved: 'Your issue has been resolved. Thank you for reporting.',
        needMoreInfo: 'We need more information. Please contact us at the provided number.',
        issueForwarded: 'This issue has been forwarded to the appropriate department.',
        statusUpdate: 'Your issue status has been updated.',
        welcome: 'Welcome to JanMitra! Let\'s make Bengaluru better together.',
      },
      kn: {
        issueReceived: 'ನಿಮ್ಮ ವರದಿಯನ್ನು ನಾವು ಸ್ವೀಕರಿಸಿದ್ದೇವೆ ಮತ್ತು ಅದರ ಮೇಲೆ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೇವೆ.',
        issueResolved: 'ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಪರಿಹರಿಸಲಾಗಿದೆ. ವರದಿ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು.',
        needMoreInfo: 'ನಮಗೆ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬೇಕು. ದಯವಿಟ್ಟು ಒದಗಿಸಿದ ಸಂಖ್ಯೆಗೆ ಸಂಪರ್ಕಿಸಿ.',
        issueForwarded: 'ಈ ಸಮಸ್ಯೆಯನ್ನು ಸೂಕ್ತ ಇಲಾಖೆಗೆ ರವಾನಿಸಲಾಗಿದೆ.',
        statusUpdate: 'ನಿಮ್ಮ ಸಮಸ್ಯೆಯ ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ.',
        welcome: 'ಜನ್‌ಮಿತ್ರಕ್ಕೆ ಸ್ವಾಗತ! ಒಟ್ಟಿಗೆ ಉತ್ತಮ ಬೆಂಗಳೂರನ್ನು ಮಾಡೋಣ.',
      },
      hi: {
        issueReceived: 'हमने आपकी रिपोर्ट प्राप्त कर ली है और इस पर काम कर रहे हैं।',
        issueResolved: 'आपकी समस्या का समाधान हो गया है। रिपोर्ट करने के लिए धन्यवाद।',
        needMoreInfo: 'हमें अधिक जानकारी की आवश्यकता है। कृपया दिए गए नंबर पर संपर्क करें।',
        issueForwarded: 'यह समस्या उचित विभाग को भेज दी गई है।',
        statusUpdate: 'आपकी समस्या की स्थिति अपडेट कर दी गई है।',
        welcome: 'जनमित्र में आपका स्वागत है! चलो मिलकर बेंगलुरु को बेहतर बनाएं।',
      },
    };

    return templates[language]?.[templateKey] || templates[en][templateKey];
  }

  // Clear translation cache
  clearCache() {
    translationCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: translationCache.size,
      maxSize: this.maxCacheSize,
      entries: Array.from(translationCache.entries()).map(([key, value]) => ({
        key,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp,
      })),
    };
  }

  // Enable/disable caching
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;