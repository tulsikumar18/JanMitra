import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../hooks/useTranslation';
import { authHelpers } from '../../config/supabase';

const LoginScreen = ({ navigation }) => {
  const { t, currentLanguage, isRTL } = useTranslation();
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [failedAttempts, setFailedAttempts] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (loginMethod === 'phone') {
      if (!formData.phone) {
        newErrors.phone = t('auth.phone');
      } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
        newErrors.phone = t('auth.invalidPhone');
      }
    } else {
      if (!formData.email) {
        newErrors.email = t('auth.email');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('auth.invalidEmail');
      }
    }

    if (!formData.password) {
      newErrors.password = t('auth.password');
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    // Check for account lockout
    if (failedAttempts >= 5) {
      Alert.alert(
        t('auth.accountLockout'),
        'Too many failed attempts. Please try again later or reset your password.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (loginMethod === 'phone') {
        result = await authHelpers.signInWithPhone(formData.phone, formData.password);
      } else {
        result = await authHelpers.signInWithEmail(formData.email, formData.password);
      }

      if (result.user) {
        // Reset failed attempts on successful login
        setFailedAttempts(0);

        Alert.alert(
          'Success!',
          'Login successful!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to main app (this will be implemented based on user role)
                navigation.replace('MainApp');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Login error:', error);

      // Increment failed attempts
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      let errorMessage = t('auth.invalidCredentials');

      if (error.message?.includes('Invalid login')) {
        errorMessage = t('auth.invalidCredentials');
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before logging in.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = t('auth.accountNotFound');
      } else if (newFailedAttempts >= 5) {
        errorMessage = t('auth.accountLockout');
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        errorMessage = t('auth.connectionError');
      }

      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleForgotPassword = () => {
    if (loginMethod === 'email') {
      // Navigate to forgot password screen (to be implemented)
      Alert.alert(
        'Forgot Password',
        'This feature will be available soon. Please contact support for password reset.',
        [{ text: 'OK' }]
      );
    } else {
      // For phone login, suggest using email instead
      setLoginMethod('email');
      Alert.alert(
        'Password Reset',
        'Please use your email address to reset your password.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLanguageChange = () => {
    navigation.navigate('LanguageSelection');
  };

  const renderLoginMethodToggle = () => (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          loginMethod === 'phone' && styles.activeToggle,
        ]}
        onPress={() => {
          setLoginMethod('phone');
          setErrors({});
        }}
      >
        <Text style={[
          styles.toggleText,
          loginMethod === 'phone' && styles.activeToggleText,
        ]}>
          {t('auth.phone')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toggleButton,
          loginMethod === 'email' && styles.activeToggle,
        ]}
        onPress={() => {
          setLoginMethod('email');
          setErrors({});
        }}
      >
        <Text style={[
          styles.toggleText,
          loginMethod === 'email' && styles.activeToggleText,
        ]}>
          {t('auth.email')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerText}>{t('auth.login')}</Text>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={handleLanguageChange}
            >
              <Text style={styles.languageButtonText}>🌐</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Welcome Text */}
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>{t('onboarding.welcome')}</Text>
                <Text style={styles.welcomeSubtext}>{t('onboarding.tagline')}</Text>
              </View>

              {/* Login Method Toggle */}
              {renderLoginMethodToggle()}

              {/* Phone/Email Input */}
              {loginMethod === 'phone' ? (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('auth.phone')}</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors.phone && styles.errorInput,
                      isRTL && { textAlign: 'right' },
                    ]}
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value.replace(/[^0-9]/g, ''))}
                    placeholder="9876543210"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoCapitalize="none"
                  />
                  {errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('auth.email')}</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors.email && styles.errorInput,
                      isRTL && { textAlign: 'right' },
                    ]}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    placeholder="email@example.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>
              )}

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.password')}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      errors.password && styles.errorInput,
                      isRTL && { textAlign: 'right' },
                    ]}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder={t('auth.password')}
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Remember Me and Forgot Password */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => handleInputChange('rememberMe', !formData.rememberMe)}
                >
                  <View style={[
                    styles.checkbox,
                    formData.rememberMe && styles.checkedCheckbox,
                  ]}>
                    {formData.rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxText}>{t('auth.rememberMe')}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                </TouchableOpacity>
              </View>

              {/* Failed Attempts Warning */}
              {failedAttempts > 0 && (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>
                    {failedAttempts >= 5
                      ? t('auth.accountLockout')
                      : `${5 - failedAttempts} attempts remaining`
                    }
                  </Text>
                </View>
              )}

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? t('common.loading') : t('auth.login')}
                </Text>
              </TouchableOpacity>

              {/* Signup Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>{t('auth.dontHaveAccount')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.signupLink}>{t('auth.signup')}</Text>
                </TouchableOpacity>
              </View>

              {/* Help and Support */}
              <View style={styles.helpContainer}>
                <TouchableOpacity style={styles.helpButton}>
                  <Text style={styles.helpText}>Need help? Contact Support</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageButtonText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#4ECDC4',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
  },
  eyeButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  eyeText: {
    fontSize: 18,
  },
  errorInput: {
    borderColor: '#E74C3C',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 5,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 16,
    color: '#666',
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signupText: {
    fontSize: 16,
    color: '#666',
  },
  signupLink: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  helpContainer: {
    alignItems: 'center',
  },
  helpButton: {
    padding: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;