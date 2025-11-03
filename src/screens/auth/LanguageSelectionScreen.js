import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../hooks/useTranslation';
import { availableLanguages } from '../../locales';

const { width, height } = Dimensions.get('window');

const LanguageSelectionScreen = ({ navigation }) => {
  const { t, changeLanguage, isLoading } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  // Start entrance animation
  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLanguageSelect = async (languageCode) => {
    if (isChangingLanguage) return;

    setSelectedLanguage(languageCode);
    setIsChangingLanguage(true);

    try {
      const success = await changeLanguage(languageCode);
      if (success) {
        // Navigate to signup screen after successful language change
        setTimeout(() => {
          navigation.replace('Signup');
        }, 500);
      } else {
        setSelectedLanguage(null);
      }
    } catch (error) {
      console.error('Error changing language:', error);
      setSelectedLanguage(null);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const getLanguageIcon = (languageCode) => {
    const icons = {
      en: require('../../assets/images/english-icon.png'),
      kn: require('../../assets/images/kannada-icon.png'),
      hi: require('../../assets/images/hindi-icon.png'),
    };
    return icons[languageCode] || icons.en;
  };

  const renderLanguageCard = (language) => {
    const isSelected = selectedLanguage === language.code;
    const isChanging = isChangingLanguage && isSelected;

    return (
      <TouchableOpacity
        key={language.code}
        style={[
          styles.languageCard,
          isSelected && styles.selectedCard,
          isChanging && styles.changingCard,
        ]}
        onPress={() => handleLanguageSelect(language.code)}
        disabled={isChangingLanguage}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.flagContainer}>
            <Text style={styles.flagEmoji}>{language.flag}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={[
              styles.nativeLanguage,
              isSelected && styles.selectedText,
            ]}>
              {language.nativeName}
            </Text>
            <Text style={[
              styles.englishLanguage,
              isSelected && styles.selectedSubText,
            ]}>
              {language.name}
            </Text>
          </View>

          {isSelected && (
            <View style={styles.checkContainer}>
              <Animated.View
                style={[
                  styles.checkmark,
                  {
                    transform: [
                      {
                        scale: animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.checkmarkText}>✓</Text>
              </Animated.View>
            </View>
          )}
        </View>

        {isChanging && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: animatedValue,
              transform: [
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>JanMitra</Text>
            <Text style={styles.taglineText}>ಜನಮಿತ್ರ • जनमित्र</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: animatedValue,
              transform: [
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.title}>{t('auth.selectLanguage')}</Text>
          <Text style={styles.subtitle}>Choose your preferred language / ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ / अपनी पसंदीदा भाषा चुनें</Text>
        </Animated.View>

        {/* Language Cards */}
        <Animated.View
          style={[
            styles.languageList,
            {
              opacity: animatedValue,
              transform: [
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {availableLanguages.map((language, index) => (
            <Animated.View
              key={language.code}
              style={{
                transform: [
                  {
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50 * (index + 1), 0],
                    }),
                  },
                ],
                opacity: animatedValue,
              }}
            >
              {renderLanguageCard(language)}
            </Animated.View>
          ))}
        </Animated.View>

        {/* Skip Button */}
        <Animated.View
          style={[
            styles.skipContainer,
            {
              opacity: animatedValue,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.replace('Signup')}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Continue with English</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: height * 0.05,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  taglineText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  languageList: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 20,
  },
  languageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#4ECDC4',
    backgroundColor: '#F0FFFF',
  },
  changingCard: {
    opacity: 0.7,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  flagContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flagEmoji: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  nativeLanguage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  englishLanguage: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  selectedText: {
    color: '#2C3E50',
  },
  selectedSubText: {
    color: '#4ECDC4',
  },
  checkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipContainer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default LanguageSelectionScreen;